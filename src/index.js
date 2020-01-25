// Name: Rubi Arviv
// ID: 033906132
import { initialize } from '@muzilator/sdk';

var stockMessage;
var midi;
var musicOn=false;
// var pitches = [];

window.addEventListener('load', () => {
  async function init() {
    var platform = await initialize();
    stockMessage = await platform.createChannel('stock');
    midi = await platform.createChannel('midi');
    startListeners();
  }
  init();
})

function onStockMessage(message) {
  let stock_name = message.data.stock_name;
  let start_date = message.data.start_date;
  let finish_date = message.data.finish_date;
  switch (message.data.type.toLowerCase()) {
    case 'music-on':
      musicOn=true;
      loadXMLFeed(stock_name,start_date,finish_date);
      // for(var pitch in pitches){

      // }
    break;
    case 'music-off':
      musicOn=false;
    break;
    default:
      break;
  }
}

function startListeners() {
  stockMessage.addEventListener('message', onStockMessage);
  stockMessage.start();
}

function getNote(x, y, dominant)
{
  // console.log(x,y,dominant);
// %GETNOTE Maps x, y position into the aligned pitch mesh structure
// %   x - floating-point x position, loosely corresponding to pitch class
// %   y - floating-point y position, loosely corresponding to register
// %   dominant - boolean indicator of which mesh to select
// %
// %   Pitches are represented as integers. x=y=0, dominant=1, maps to 62.
// %
// %   Sketch:
// %
// %   dominant=0            x
// %                  -2 -1  0  1  2
// %                        ...
// %           1  ...   69 72 76 79  ...
// %        y  0  ...   57 60 64 67  ...
// %          -1  ...   45 48 52 55  ...
// %                        ...
// %
// %   dominant=1            x
// %                  -2 -1  0  1  2
// %                        ...
// %           1  ... 67 71 74 77 81 ...
// %        y  0  ... 55 59 62 65 69 ...
// %          -1  ... 43 47 50 53 57 ...
// %                        ...
// %
    let pitch=0;
    if (dominant)
    {
        if (x < -1.5)
            pitch = getNote(x + 3, 0, dominant) - 10;
        else if(x < -.5)
            pitch = 59;
        else if(x < .5)
            pitch = 62;
        else if(x < 1.5)
            pitch = 65;
        else
            pitch = getNote(x - 3, 0, dominant) + 10;
    }
    else
    {
        if(x < -1)
            pitch = getNote(x + 3, 0, dominant) - 10;
        else if(x < 0)
            pitch = 60;
        else if(x < 1)
            pitch = 64;
        else if(x < 2)
            pitch = 67;
        else
            pitch = getNote(x - 3, 0, dominant) + 10;
    }

    pitch=pitch+Math.round(y)*12;
    return pitch;
}

function sleep(delay) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}

function loadXMLFeed(stock_name,start_date,finish_date){
  // pitches = [];
    // const url = "https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=1min&apikey=5L58QGRKEDSSMQRG";
    var stock_url = "https://sandbox.tradier.com/v1/markets/history?symbol="+
                    stock_name+"&interval=daily&start="+
                    start_date+"&end="+finish_date;
    // fetch(stock_url,{headers: new Headers {'Authenticate': 'Basic user:password'}, redirect: 'follow')
    // .then(response=>response.text())
    // .then(data=> {
    //     let json = JSON.parse(data)
    //     console.log(json);
    // });

    let h = new Headers();
    h.append('Accept', 'application/json');
    h.append('Authorization', 'Bearer mKPvM9IKK4Ru5kCgw8wbNBRzdKqw');


    let req = new Request(stock_url, {
        method: 'GET',
        headers: h,
        mode: 'cors'
    });

    // date: "2019-05-21"
    // open: 185.22
    // high: 188
    // low: 184.7
    // close: 186.6
    // volume: 28364848
    var max_high = -1;
    var min_low = 1000000;
    var max_vol = 0;
    fetch(req)
      .then(response=>response.text())
      .then(data=> {
          let history = JSON.parse(data);
          let days = history.history.day;
          //.filter(function (entry) {
          //  return entry.date > '2015-08-01' && entry.date < '2015-09-15';});
          for (let i =0;i < days.length;i++){
              // let date = days[i].date;
              // let open = days[i].open;
              let high = parseInt(days[i].high);
              let low = parseInt(days[i].low);
              max_high = high>max_high?high:max_high;
              min_low = low<min_low?low:min_low;
              // let close = history.history.day[i].close;
              let volume = parseInt(days[i].volume);
              max_vol = volume>max_vol?volume:max_vol;
          }
          console.log('max_high: ' + max_high);
          console.log('min_low: ' + min_low);
          console.log('max_vol: ' + max_vol);
          for (let i =0;i < days.length;i++){
              // let date = days[i].date;
              let open = days[i].open;
              let close = days[i].close;
              let volume = parseInt(days[i].volume);
              let pitch = getNote((close-min_low)/(max_high-min_low)*3,volume/max_vol*3,(close-open)>=0);
              console.log(pitch);
              midi.postMessage({type: 'note-on',pitch: pitch, velocity: 100});
              sleep(500);
              midi.postMessage({type: 'note-off',pitch: pitch, velocity: 100});
              if(!musicOn) break; 
              // pitches.push(pitch);
          }

    });
    // return pitches;
}

