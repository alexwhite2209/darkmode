# Car motion model for W3 (local coordinates, metres, seconds). Shared by the W3 build and the camera.
# The scene opens mid-drift: the car is already sliding into the hairpin when the camera bursts out of the smoke.
import math
from mathutils import Vector

ARC_R = 32.0
Y_ARC = -55.0
ARC_C = Vector((ARC_R, Y_ARC, 0))
V_IN = 28.0                     # entry speed
V_OUT = 9.0                     # speed when the slide starts
T_ARC, T_SLIDE, T_STOP = 8.8, 11.8, 12.5
ARC_DEC = (V_IN - V_OUT) / (T_SLIDE - T_ARC)

def _smooth(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)

def _arc_end():
    tau = T_SLIDE - T_ARC
    s = V_IN * tau - 0.5 * ARC_DEC * tau * tau
    th = math.pi + s / ARC_R
    return ARC_C + Vector((math.cos(th), math.sin(th), 0)) * ARC_R, th + math.pi / 2

def car_state(t):
    """dict(pos, heading (velocity dir), yaw (body), v, beta, steer)"""
    if t < T_ARC:                                   # approach on the straight (off camera)
        s = V_IN * (T_ARC - t)
        pos = Vector((0, Y_ARC + s, 0)); psi = -math.pi / 2; v = V_IN
    elif t < T_SLIDE:
        tau = t - T_ARC
        s = V_IN * tau - 0.5 * ARC_DEC * tau * tau
        th = math.pi + s / ARC_R
        pos = ARC_C + Vector((math.cos(th), math.sin(th), 0)) * ARC_R
        psi = th + math.pi / 2; v = V_IN - ARC_DEC * tau
    else:
        p0, psi = _arc_end()
        tau = min(t, T_STOP) - T_SLIDE
        dec = V_OUT / (T_STOP - T_SLIDE)
        s = V_OUT * tau - 0.5 * dec * tau * tau
        pos = p0 + Vector((math.cos(psi), math.sin(psi), 0)) * s
        v = max(0.0, V_OUT - dec * tau)
    beta = 0.0
    if t >= T_ARC - 0.6:
        beta = math.radians(38) * _smooth((t - (T_ARC - 0.6)) / 0.55)
        beta += math.radians(3) * math.sin((t - T_ARC) * 5.0) * _smooth((t - T_ARC) / 0.8) * (1 - _smooth((t - (T_SLIDE - 0.6)) / 0.6))
        beta += math.radians(40) * _smooth((t - (T_SLIDE - 0.5)) / 1.2)
    steer = -0.5 * beta
    return {"pos": pos, "heading": psi, "yaw": psi + beta, "v": v, "beta": beta, "steer": steer}

def car_matrix(t):
    from mathutils import Matrix
    st = car_state(t)
    return Matrix.Translation(st["pos"]) @ Matrix.Rotation(st["yaw"], 4, 'Z')
