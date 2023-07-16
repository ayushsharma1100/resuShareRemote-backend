module.exports = ()=>{
    let Otp = "";
    for (let i = 0; i < 4; i++) {
        Otp += String(Math.round(Math.random()*9))
    }
    return Otp;
}