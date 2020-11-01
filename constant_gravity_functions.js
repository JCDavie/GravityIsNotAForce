/*  GravityIsNotAForce - Visualising geodesics in general relativity
    Copyright (C) 2020 Tim J. Hutton

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


// classes:

class Trajectory {
    constructor(start, end, color, hover_color) {
        this.ends = [start, end];
        this.color = color;
        this.end_colors = [color, color];
        this.hover_color = hover_color;
        this.end_sizes = [6, 4];
        this.default_end_sizes = [6, 4];
        this.mid_size = 2;
        this.hover_size = 10;
    }
}

class Graph {
    constructor(rect, frame_acceleration) {
        this.rect = rect;
        this.frame_acceleration = frame_acceleration;
    }
    get transform() {
        var forwardsDistortion = p => transformBetweenAcceleratingReferenceFrames(p, this.frame_acceleration - earth_surface_gravity);
        var backwardsDistortion = p => transformBetweenAcceleratingReferenceFrames(p, earth_surface_gravity - this.frame_acceleration);
        return new ComposedTransform(new Transform(forwardsDistortion, backwardsDistortion), new LinearTransform2D(spacetime_range, this.rect));
    }
}

// functions:


function drawGeodesic(trajectory, graph) {
    // draw a line that is straight in an inertial frame but may be not be straight in this frame, depending on its acceleration

    var start_inertial = fromEarthSurfaceGravityAcceleratingFrameToInertialFrame(trajectory.ends[0]);
    var end_inertial = fromEarthSurfaceGravityAcceleratingFrameToInertialFrame(trajectory.ends[1]);
    var screen_pts = getLinePoints(start_inertial, end_inertial).map(fromInertialFrameToEarthSurfaceGravityAcceleratingFrame).map(graph.transform.forwards);
    ctx.lineWidth = 2;
    drawLine(screen_pts, trajectory.color);
    fillSpacedCircles(screen_pts, trajectory.mid_size, trajectory.color, 10);
    var a1 = fromInertialFrameToEarthSurfaceGravityAcceleratingFrame(lerp(start_inertial, end_inertial, 0.59));
    var a2 = fromInertialFrameToEarthSurfaceGravityAcceleratingFrame(lerp(start_inertial, end_inertial, 0.60));
    drawArrowHead(graph.transform.forwards(a1), graph.transform.forwards(a2), 15);
    for(var iEnd = 0; iEnd < 2; iEnd++) {
        fillCircle(graph.transform.forwards(trajectory.ends[iEnd]), trajectory.end_sizes[iEnd], trajectory.end_colors[iEnd]);
    }
}

function fromEarthSurfaceGravityAcceleratingFrameToInertialFrame(p) {
    return transformBetweenAcceleratingReferenceFrames(p, 0 - earth_surface_gravity);
}

function fromInertialFrameToEarthSurfaceGravityAcceleratingFrame(p) {
    return transformBetweenAcceleratingReferenceFrames(p, earth_surface_gravity - 0);
}

function transformBetweenAcceleratingReferenceFrames(p, delta_acceleration) {
    var t_zero = spacetime_range.center.x; // central time point (e.g. t=0) gets no spatial distortion
    var distortion = getDistortionWithConstantAcceleration(p.x, t_zero, delta_acceleration);
    return add(p, distortion);
}

function getDistortionWithConstantAcceleration(t, t0, delta_acceleration) {
    var dy = - distanceTravelledWithConstantAcceleration(t - t0, delta_acceleration);
    return new P(0, dy, 0, 0);
}