define([
	'goo/math/Vector3',
	'goo/renderer/bounds/BoundingVolume',
	'goo/math/MathUtils'
],
/** @lends */
function (
	Vector3,
	BoundingVolume,
	MathUtils
) {
	"use strict";

	/**
	 * @class <code>BoundingBox</code> defines an axis-aligned cube that defines a container for a group of vertices of a
	 * particular piece of geometry. This box defines a center and extents from that center along the x, y and z axis. <br>
	 *        <br>
	 *        A typical usage is to allow the class define the center and radius by calling either <code>containAABB</code> or
	 *        <code>averagePoints</code>. A call to <code>computeFramePoint</code> in turn calls <code>containAABB</code>.
	 */
	function BoundingBox(center, xExtent, yExtent, zExtent) {
		BoundingVolume.call(this, center);

		this.xExtent = xExtent !== undefined ? xExtent : 1;
		this.yExtent = yExtent !== undefined ? yExtent : 1;
		this.zExtent = zExtent !== undefined ? zExtent : 1;

		this._compVect1 = new Vector3();
		this._compVect2 = new Vector3();
		this.vec = new Vector3();

		this.corners = [];
		for (var i = 0; i < 8; i++) {
			this.corners.push(new Vector3());
		}
	}

	BoundingBox.prototype = Object.create(BoundingVolume.prototype);

	BoundingBox.prototype.computeFromPoints = function (verts) {
		var min = this.min;
		var max = this.max;
		var vec = this.vec;

		min.setd(Infinity, Infinity, Infinity);
		max.setd(-Infinity, -Infinity, -Infinity);
		var x, y, z;
		for (var i = 0; i < verts.length; i += 3) {
			x = verts[i + 0];
			y = verts[i + 1];
			z = verts[i + 2];
			min.x = x < min.x ? x : min.x;
			min.y = y < min.y ? y : min.y;
			min.z = z < min.z ? z : min.z;
			max.x = x > max.x ? x : max.x;
			max.y = y > max.y ? y : max.y;
			max.z = z > max.z ? z : max.z;
		}

		vec.setv(max).subv(min).div(2.0);
		this.xExtent = vec.x;
		this.yExtent = vec.y;
		this.zExtent = vec.z;

		this.center.setv(max).addv(min).div(2.0);
	};

	BoundingBox.prototype.computeFromPrimitives = function (data, section, indices, start, end) {
		if (end - start <= 0) {
			return;
		}

		var min = this._compVect1.set(Infinity, Infinity, Infinity);
		var max = this._compVect2.set(-Infinity, -Infinity, -Infinity);

		var store = [];

		for (var i = start; i < end; i++) {
			store = data.getPrimitiveVertices(indices[i], section, store);
			for (var j = 0; j < store.length; j++) {
				BoundingBox.checkMinMax(min, max, store[j]);
			}
		}

		this.center.copy(min.add(max));
		this.center.mul(0.5);

		this.xExtent = max.x - this.center.x;
		this.yExtent = max.y - this.center.y;
		this.zExtent = max.z - this.center.z;
	};

	BoundingBox.checkMinMax = function (min, max, point) {
		if (point.x < min.x) {
			min.x = point.x;
		}
		if (point.x > max.x) {
			max.x = point.x;
		}

		if (point.y < min.y) {
			min.y = point.y;
		}
		if (point.y > max.y) {
			max.y = point.y;
		}

		if (point.z < min.z) {
			min.z = point.z;
		}
		if (point.z > max.z) {
			max.z = point.z;
		}
	};

	BoundingBox.prototype.transform = function (transform, box) {
		if (box === null) {
			box = new BoundingBox();
		}

		var corners = this.corners;
		this.getCorners(corners);

		// Transform all of these points by the transform
		for (var i = 0; i < corners.length; i++) {
			transform.matrix.applyPostPoint(corners[i]);
		}
		// Now compute based on these transformed points
		var minX = corners[0].data[0];
		var minY = corners[0].data[1];
		var minZ = corners[0].data[2];
		var maxX = minX;
		var maxY = minY;
		var maxZ = minZ;
		for (var i = 1; i < corners.length; i++) {
			var curX = corners[i].data[0];
			var curY = corners[i].data[1];
			var curZ = corners[i].data[2];
			minX = Math.min(minX, curX);
			minY = Math.min(minY, curY);
			minZ = Math.min(minZ, curZ);
			maxX = Math.max(maxX, curX);
			maxY = Math.max(maxY, curY);
			maxZ = Math.max(maxZ, curZ);
		}

		var ctrX = (maxX + minX) * 0.5;
		var ctrY = (maxY + minY) * 0.5;
		var ctrZ = (maxZ + minZ) * 0.5;

		box.center.setd(ctrX, ctrY, ctrZ);
		box.xExtent = maxX - ctrX;
		box.yExtent = maxY - ctrY;
		box.zExtent = maxZ - ctrZ;

		return box;
	};

	BoundingBox.prototype.getCorners = function (store) {
		if (!store || store.length !== 8) {
			store = [];
			for (var i = 0; i < store.length; i++) {
				store.push(new Vector3());
			}
		}
		store[0].setd(this.center.data[0] + this.xExtent, this.center.data[1] + this.yExtent, this.center.data[2] + this.zExtent);
		store[1].setd(this.center.data[0] + this.xExtent, this.center.data[1] + this.yExtent, this.center.data[2] - this.zExtent);
		store[2].setd(this.center.data[0] + this.xExtent, this.center.data[1] - this.yExtent, this.center.data[2] + this.zExtent);
		store[3].setd(this.center.data[0] + this.xExtent, this.center.data[1] - this.yExtent, this.center.data[2] - this.zExtent);
		store[4].setd(this.center.data[0] - this.xExtent, this.center.data[1] + this.yExtent, this.center.data[2] + this.zExtent);
		store[5].setd(this.center.data[0] - this.xExtent, this.center.data[1] + this.yExtent, this.center.data[2] - this.zExtent);
		store[6].setd(this.center.data[0] - this.xExtent, this.center.data[1] - this.yExtent, this.center.data[2] + this.zExtent);
		store[7].setd(this.center.data[0] - this.xExtent, this.center.data[1] - this.yExtent, this.center.data[2] - this.zExtent);
		return store;
	};

	BoundingBox.prototype.whichSide = function (plane) {
		var radius = Math.abs(this.xExtent * plane.normal.x) + Math.abs(this.yExtent * plane.normal.y) + Math.abs(this.zExtent * plane.normal.z);

		var planeData = plane.normal.data;
		var pointData = this.center.data;
		var distance = planeData[0] * pointData[0] + planeData[1] * pointData[1] + planeData[2] * pointData[2] - plane.constant;

		if (distance < -radius) {
			return BoundingVolume.Inside;
		} else if (distance > radius) {
			return BoundingVolume.Outside;
		} else {
			return BoundingVolume.Intersects;
		}
	};

	BoundingBox.prototype._pseudoDistance = function (plane, point) {
		return plane.normal.x * point.x + plane.normal.y * point.y + plane.normal.z * point.z - plane.constant;
	};

	BoundingBox.prototype._maxAxis = function (scale) {
		return Math.max(Math.abs(scale.x), Math.max(Math.abs(scale.y), Math.abs(scale.z)));
	};

	BoundingBox.prototype.toString = function () {
		var x = Math.round(this.center.x * 10) / 10;
		var y = Math.round(this.center.y * 10) / 10;
		var z = Math.round(this.center.z * 10) / 10;

		return '[' + x + ',' + y + ',' + z + ']' + ' - ' + '[' + this.xExtent + ',' + this.yExtent + ',' + this.zExtent + ']';
	};

	BoundingBox.prototype.intersects = function (bv) {
		return bv.intersectsBoundingBox(this);
	};

	BoundingBox.prototype.intersectsBoundingBox = function (bb) {
		if (this.center.x + this.xExtent < bb.center.x - bb.xExtent || this.center.x - this.xExtent > bb.center.x + bb.xExtent) {
			return false;
		} else if (this.center.y + this.yExtent < bb.center.y - bb.yExtent || this.center.y - this.yExtent > bb.center.y + bb.yExtent) {
			return false;
		} else if (this.center.z + this.zExtent < bb.center.z - bb.zExtent || this.center.z - this.zExtent > bb.center.z + bb.zExtent) {
			return false;
		} else {
			return true;
		}
	};

	BoundingBox.prototype.intersectsSphere = function (bs) {
		if (Math.abs(this.center.x - bs.center.x) < bs.radius + this.xExtent
				&& Math.abs(this.center.y - bs.center.y) < bs.radius + this.yExtent
				&& Math.abs(this.center.z - bs.center.z) < bs.radius + this.zExtent) {
			return true;
		}

		return false;
	};

	BoundingBox.prototype.testStaticAABBAABB = function (bb, contact) {
		var a = this;
		var b = bb;

		// [Minimum Translation Vector]
		var mtvInfo = {
			mtvDistance: 10000000000, // Set current minimum distance (max float value so next value is always less)
			mtvAxis: new Vector3()
			// Axis along which to travel with the minimum distance
		};

		// [Axes of potential separation]
		// * Each shape must be projected on these axes to test for intersection:
		//
		// (1, 0, 0) A0 (= B0) [X Axis]
		// (0, 1, 0) A1 (= B1) [Y Axis]
		// (0, 0, 1) A1 (= B2) [Z Axis]

		// [X Axis]
		if (!this.testAxisStatic(Vector3.UNIT_X, a.center.x - a.xExtent, a.center.x + a.xExtent, b.center.x - b.xExtent, b.center.x + b.xExtent,
			mtvInfo)) {
			return false;
		}

		// [Y Axis]
		if (!this.testAxisStatic(Vector3.UNIT_Y, a.center.y - a.yExtent, a.center.y + a.yExtent, b.center.y - b.yExtent, b.center.y + b.yExtent,
			mtvInfo)) {
			return false;
		}

		// [Z Axis]
		if (!this.testAxisStatic(Vector3.UNIT_Z, a.center.z - a.zExtent, a.center.z + a.zExtent, b.center.z - b.zExtent, b.center.z + b.zExtent,
			mtvInfo)) {
			return false;
		}

		if (contact) {
			contact.isIntersecting = true;

			// Calculate Minimum Translation Vector (MTV) [normal * penetration]
			// contact.normal = mtvInfo.mtvAxis.normalize();
			contact.normal = mtvInfo.mtvAxis;

			// Multiply the penetration depth by itself plus a small increment
			// When the penetration is resolved using the MTV, it will no longer intersect
			contact.penetration = Math.sqrt(mtvInfo.mtvDistance) * 1.001;
			// contact.penetration = mtvInfo.mtvDistance * 1.001;
		}

		return true;
	};

	BoundingBox.prototype.testAxisStatic = function (axis, minA, maxA, minB, maxB, mtvInfo) {
		// [Separating Axis Theorem]
		// * Two convex shapes only overlap if they overlap on all axes of separation
		// * In order to create accurate responses we need to find the collision vector (Minimum Translation Vector)
		// * Find if the two boxes intersect along a single axis
		// * Compute the intersection interval for that axis
		// * Keep the smallest intersection/penetration value
		var axisLengthSquared = Vector3.dot(axis, axis);

		// If the axis is degenerate then ignore
		if (axisLengthSquared < 0.000001) {
			return true;
		}

		// Calculate the two possible overlap ranges
		// Either we overlap on the left or the right sides
		var d0 = maxB - minA; // 'Left' side
		var d1 = maxA - minB; // 'Right' side

		// Intervals do not overlap, so no intersection
		if (d0 <= 0.0 || d1 <= 0.0) {
			return false;
		}

		// Find out if we overlap on the 'right' or 'left' of the object.
		var overlap = d0 < d1 ? d0 : -d1;

		// The mtd vector for that axis
		// var sep = axis * (overlap / axisLengthSquared);
		var sep = new Vector3().copy(axis).mul(overlap / axisLengthSquared);

		// The mtd vector length squared
		var sepLengthSquared = Vector3.dot(sep, sep);

		// If that vector is smaller than our computed Minimum Translation Distance use that vector as our current MTV distance
		if (sepLengthSquared < mtvInfo.mtvDistance) {
			mtvInfo.mtvDistance = sepLengthSquared;
			// mtvInfo.mtvAxis = sep;
			mtvInfo.mtvAxis = axis;
		}

		return true;
	};

	BoundingBox.prototype.intersectsRay = function (ray) {
		if (isNaN(this.center.x) || isNaN(this.center.y) || isNaN(this.center.z)) {
			return false;
		}

		// var diff = Vector3.sub(ray.origin, this.center, this._compVect1);
		var diff = this._compVect1.setv(ray.origin).subv(this.center);
		var direction = ray.direction;

		var t = [0.0, Infinity];

		// Check for degenerate cases and pad using zero tolerance. Should give close enough result.
		var x = this.xExtent;
		if (x < MathUtils.ZERO_TOLERANCE && x >= 0) {
			x = MathUtils.ZERO_TOLERANCE;
		}
		var y = this.yExtent;
		if (y < MathUtils.ZERO_TOLERANCE && y >= 0) {
			y = MathUtils.ZERO_TOLERANCE;
		}
		var z = this.zExtent;
		if (z < MathUtils.ZERO_TOLERANCE && z >= 0) {
			z = MathUtils.ZERO_TOLERANCE;
		}

		var notEntirelyClipped = //
			BoundingBox.clip(direction.data[0], -diff.data[0] - x, t) && //
				BoundingBox.clip(-direction.data[0], diff.data[0] - x, t) && //
				BoundingBox.clip(direction.data[1], -diff.data[1] - y, t) && //
				BoundingBox.clip(-direction.data[1], diff.data[1] - y, t) && //
				BoundingBox.clip(direction.data[2], -diff.data[2] - z, t) && //
				BoundingBox.clip(-direction.data[2], diff.data[2] - z, t);

		if (notEntirelyClipped && (t[0] !== 0.0 || t[1] !== Infinity)) {
			return true;
		}

		return false;
	};

	BoundingBox.prototype.intersectsRayWhere = function (ray) {
		if (isNaN(this.center.x) || isNaN(this.center.y) || isNaN(this.center.z)) {
			return null;
		}

		var diff = Vector3.sub(ray.origin, this.center, this._compVect1);
		var direction = ray.direction;

		var t = [0.0, Infinity];

		// Check for degenerate cases and pad using zero tolerance. Should give close enough result.
		var x = this.xExtent;
		if (x < MathUtils.ZERO_TOLERANCE && x >= 0) {
			x = MathUtils.ZERO_TOLERANCE;
		}
		var y = this.yExtent;
		if (y < MathUtils.ZERO_TOLERANCE && y >= 0) {
			y = MathUtils.ZERO_TOLERANCE;
		}
		var z = this.zExtent;
		if (z < MathUtils.ZERO_TOLERANCE && z >= 0) {
			z = MathUtils.ZERO_TOLERANCE;
		}

		var notEntirelyClipped = //
			BoundingBox.clip(direction.x, -diff.x - x, t) && //
				BoundingBox.clip(-direction.x, diff.x - x, t) && //
				BoundingBox.clip(direction.y, -diff.y - y, t) && //
				BoundingBox.clip(-direction.y, diff.y - y, t) && //
				BoundingBox.clip(direction.z, -diff.z - z, t) && //
				BoundingBox.clip(-direction.z, diff.z - z, t);

		if (notEntirelyClipped && (t[0] !== 0.0 || t[1] !== Infinity)) {
			if (t[1] > t[0]) {
				var distances = t;
				var points = [new Vector3(ray.direction).mul(distances[0]).add(ray.origin),
					new Vector3(ray.direction).mul(distances[1]).add(ray.origin)];
				return {
					"distances": distances,
					"points": points
				};
			}

			var distances = [t[0]];
			var points = [new Vector3(ray.direction).mul(distances[0]).add(ray.origin)];
			return {
				"distances": distances,
				"points": points
			};
		}

		return null;
	};

	BoundingBox.clip = function (denom, numer, t) {
		// Return value is 'true' if line segment intersects the current test
		// plane. Otherwise 'false' is returned in which case the line segment
		// is entirely clipped.
		if (denom > 0.0) {
			if (numer > denom * t[1]) {
				return false;
			}
			if (numer > denom * t[0]) {
				t[0] = numer / denom;
			}
			return true;
		} else if (denom < 0.0) {
			if (numer > denom * t[0]) {
				return false;
			}
			if (numer > denom * t[1]) {
				t[1] = numer / denom;
			}
			return true;
		} else {
			return numer <= 0.0;
		}
	};

	BoundingBox.prototype.merge = function (bv) {
		if (bv instanceof BoundingBox) {
			return this.mergeBox(bv.center, bv.xExtent, bv.yExtent, bv.zExtent, this);
		} else {
			return this.mergeBox(bv.center, bv.radius, bv.radius, bv.radius, this);
		}
	};

	BoundingBox.prototype.mergeBox = function (center, xExtent, yExtent, zExtent, store) {
		if (!store) {
			store = new BoundingBox();
		}

		var calcVec1 = this._compVect1;
		var calcVec2 = this._compVect2;

		calcVec1.x = this.center.x - this.xExtent;
		if (calcVec1.x > center.x - xExtent) {
			calcVec1.x = center.x - xExtent;
		}
		calcVec1.y = this.center.y - this.yExtent;
		if (calcVec1.y > center.y - yExtent) {
			calcVec1.y = center.y - yExtent;
		}
		calcVec1.z = this.center.z - this.zExtent;
		if (calcVec1.z > center.z - zExtent) {
			calcVec1.z = center.z - zExtent;
		}

		calcVec2.x = this.center.x + this.xExtent;
		if (calcVec2.x < center.x + xExtent) {
			calcVec2.x = center.x + xExtent;
		}
		calcVec2.y = this.center.y + this.yExtent;
		if (calcVec2.y < center.y + yExtent) {
			calcVec2.y = center.y + yExtent;
		}
		calcVec2.z = this.center.z + this.zExtent;
		if (calcVec2.z < center.z + zExtent) {
			calcVec2.z = center.z + zExtent;
		}

		store.center.set(calcVec2).addv(calcVec1).muld(0.5, 0.5, 0.5);

		store.xExtent = calcVec2.x - store.center.x;
		store.yExtent = calcVec2.y - store.center.y;
		store.zExtent = calcVec2.z - store.center.z;

		return store;
	};

	BoundingBox.prototype.clone = function (store) {
		if (store && store instanceof BoundingBox) {
			store.center.setv(this.center);
			store.xExtent = this.xExtent;
			store.yExtent = this.yExtent;
			store.zExtent = this.zExtent;
			return store;
		}

		return new BoundingBox(this.center, this.xExtent, this.yExtent, this.zExtent);
	};

	return BoundingBox;
});