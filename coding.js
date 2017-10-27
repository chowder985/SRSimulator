// 코딩 시작
var startTimer;
function startGame(){
  document.getElementById("inputCode").disabled = false;
  document.getElementById('inputCode').focus();
  $(".timer").css({"top": "10%", "right": "2%"});
  var start = new Date().getTime();
  elapse = 0.0;

  startTimer = setInterval(function(){
    var time = new Date().getTime() - start;
    //console.log(time);
    elapse = Math.round(time/100)/10;
    if(Math.round(elapse) === elapse){elapse += ".0"}
    $(".timer>p").text(elapse+"초");
  }, 100);

  $(".textToType").append("<p>"+fakeData[i]+"</p>");

  document.addEventListener("keydown", onEnter, false);

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
    if(inputText !== fakeData[i]){
      $("p[num="+numOfP+"]").css({"text-decoration": "line-through"});
      i--;
    }else{
      $("p[num="+numOfP+"]").css({"text-decoration": "none"});
    }
    i++;
    numOfP++;
    if(i < fakeData.length){
      $(".textToType").append("<p>"+fakeData[i]+"</p>");
    }else{
      //alert("Game Over! "+elapse+"초 기록!");
      resetGame();
      $(".codingActivity").css({"display": "none"})
    }
  }
}

function resetGame(){
  codingStarted = false;
  elapse = 0.0;
  i=0;
  numOfP = 0;
  countDown = 2;
  $(".timer>p").text("3");
  $(".textToType > p").remove();
  $(".timer").css({"top": "50%", "right": "43%"});
  clearInterval(startTimer)
}
