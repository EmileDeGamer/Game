let showPasswordBox = document.getElementById('showPassword')
let showRepeatPasswordBox = document.getElementById('showRepeatPassword')
let password = document.getElementById('password')
let repeatPassword = document.getElementById('repeatPassword')

if(showPasswordBox != null){
    showPassword(showPasswordBox, password)
    showPasswordBox.onclick = function(){showPassword(showPasswordBox, password)}
}
if(showRepeatPasswordBox != null){
    showPassword(showRepeatPasswordBox, repeatPassword)
    showRepeatPasswordBox.onclick = function(){showPassword(showRepeatPasswordBox, repeatPassword)}
}

function showPassword(checkbox, input){
    if(checkbox.checked){
        input.type="text"
    }
    else{
        input.type="password"
    }
}