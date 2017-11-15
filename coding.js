// 코딩 시작
var startTimer;
document.addEventListener("keydown", onEnter, false);
function startGame(){
  document.getElementById("inputCode").disabled = false;
  document.getElementById('inputCode').focus();
  $(".timer").css({"top": "10%", "left": "auto", "right": "7%"});
  var start = new Date().getTime();
  elapse = 0.0;

  startTimer = setInterval(function(){
    var time = new Date().getTime() - start;
    //console.log(time);
    elapse = Math.round(time/100)/10;
    if(Math.round(elapse) === elapse){elapse += ".0"}
    $(".timer>p").text(elapse+"초");
  }, 100);

  $(".textToType").append("<p>"+selectedLang[i]+"</p>");

  document.addEventListener("click", function(){
    document.getElementById('inputCode').focus();
  })
}

function onEnter(e){
  if (e.keyCode == 13) {
    var inputText = document.getElementById('inputCode').value;
    // console.log(inputText);
    // console.log(fakeData[i]);
    document.getElementById('inputCode').value = "";

    $(".textToType").append("<p num="+numOfP+">"+inputText+"</p>");
    if(inputText !== selectedLang[i]){
      $("p[num="+numOfP+"]").css({"text-decoration": "line-through"});
      i--;
    }else{
      $("p[num="+numOfP+"]").css({"text-decoration": "none"});
    }
    i++;
    numOfP++;
    if(i < selectedLang.length){
      $(".textToType").append("<p>"+selectedLang[i]+"</p>");
    }else{
      //alert("Game Over! "+elapse+"초 기록!");
      console.log(elapse);
      var sendCodingData=0;
      if(elapse <= 60){
        sendCodingData=16;
      }
      else if(elapse <= 80){
        sendCodingData=8;
      }
      else if(elapse <= 100){
        sendCodingData=5;
      }
      else{
        sendCodingData=-16;
      }
      // 서버에 sendCodingData값 전송 후 Coding 데이터에 값 추가하기

      // 탁구 소요시간 3시간 추가
      hours+=3;
      localStorage.setItem("hours", hours);
      document.querySelector(".Hour").textContent = Number(hours%12)+":00";
      document.querySelector("#dateText").textContent="Day "+Number(Math.floor(hours/12)+1);
      if((Math.floor(hours/12)+1)%3===0){
        window.location.href = "episode"+(Math.floor(hours/12)+1)/3+".html";
      }
      console.log(hours);
      resetGame();
      $(".codingActivity").css({"display": "none"})
      localStorage.setItem("playerX", player.position.x);
      localStorage.setItem("playerY", player.position.y);
      localStorage.setItem("playerZ", player.position.z);
      location.reload();
    }
  }
}

function resetGame(){
  codingStarted = false;
  elapse = 0.0;
  i=0;
  numOfP = 0;
  countDown = 2;
  selectedLang = null;
  $(".timer>p").text("3");
  $(".textToType > p").remove();
  $(".timer").css({"top": "48%", "left": "50%"});
  clearInterval(startTimer)
}
