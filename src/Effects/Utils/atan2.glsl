float atan2(in float y, in float x){
    return x == 0.0 ? sin(y) * PI / 2.0 : atan(y, x);
}