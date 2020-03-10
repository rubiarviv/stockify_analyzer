// Name: Rubi Arviv
// ID: 033906132
import { initialize } from '@muzilator/sdk';
import {miditime, miditime1, miditime2, get_data_range, linear_scale_pct, scale_to_note, note_to_midi_pitch, scale_to_note_classic} from './translator';
var stockMessage;
var midi;
var musicOn=false;


const c_major = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const c_minor = ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'];


window.addEventListener('load', () => {
  async function init() {
    var platform = await initialize();
    stockMessage = await platform.createChannel('stock');
    midi = await platform.createChannel('midi');
    startListeners();
  }
  // loadXMLFeed2('AAPL','2020-01-30','2020-02-29');
  init();
})

function onStockMessage(message) {
  let stock_name = message.data.stock_name;
  let start_date = message.data.start_date;
  let finish_date = message.data.finish_date;
  switch (message.data.type.toLowerCase()) {
    case 'music-on':
      musicOn=true;
      loadXMLFeed2(stock_name,start_date,finish_date);
    break;
    case 'music-off':
      musicOn=false;
    break;
    default:
      break;
  }
}

function startListeners() {
  // testMidi();
  stockMessage.addEventListener('message', onStockMessage);
  stockMessage.start();
}

function getNote(x, y, dominant)
{
  console.log(x,y,dominant);
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

function loadXMLFeed2(stock_name,start_date,finish_date){
  console.log(stock_name);
  console.log(start_date);
  console.log(finish_date);
  var stock_url = "https://sandbox.tradier.com/v1/markets/history?symbol="+
                    stock_name+"&interval=daily&start="+
                    start_date+"&end="+finish_date;
  let h = new Headers();
  h.append('Accept', 'application/json');
  h.append('Authorization', 'Bearer mKPvM9IKK4Ru5kCgw8wbNBRzdKqw');


  let req = new Request(stock_url, {
      method: 'GET',
      headers: h,
      mode: 'cors'
  });

  fetch(req)
      .then(response=>response.text())
      .then(data=> {
          let history = JSON.parse(data);
          let days = history.history.day;
          let min_max  = miditime.get_data_range(days, 'close');
          let min_max1  = miditime.get_data_range(days, 'high');
          let min_max2  = miditime.get_data_range(days, 'low');
          let scale = c_major;
          if(days[0] > days[days.length-1]){
            scale=c_minor;
          }
          for(let day in days)
          {
            let high = parseInt(days[day].high);
            let low = parseInt(days[day].low);
            let scale_pct = miditime.linear_scale_pct(min_max[0],min_max[1],days[day].close);
            let scale_pct1 = miditime1.linear_scale_pct(min_max1[0],min_max1[1],high);
            let scale_pct2 = miditime2.linear_scale_pct(min_max2[0],min_max2[1],low);
            console.log('scale_pct: ' + scale_pct);
            let note = miditime.scale_to_note(scale_pct, scale);
            let note1 = miditime1.scale_to_note(scale_pct1, scale);
            let note2 = miditime2.scale_to_note(scale_pct2, scale);
            console.log('note: ' + note);
            if(note == null) continue;
            let pitch = miditime.note_to_midi_pitch(note);
            let pitch1 = miditime1.note_to_midi_pitch(note1);
            let pitch2 = miditime2.note_to_midi_pitch(note2);
            console.log('pitch :'+ pitch);
            if(midi != null){
              midi.postMessage({type: 'note-on',pitch: pitch, velocity: 127});
              midi.postMessage({type: 'note-on',pitch: pitch1, velocity: 63});
              midi.postMessage({type: 'note-on',pitch: pitch2, velocity: 63});
              let diff=(100*(min_max[1]-min_max[0]))/(high-low);
              if(diff>600){
                diff=600;
              }
              sleep(diff);
              console.log('diff :'+ diff);
              midi.postMessage({type: 'note-off',pitch: pitch, velocity: 100});
              midi.postMessage({type: 'note-off',pitch: pitch1, velocity: 100});
              midi.postMessage({type: 'note-off',pitch: pitch2, velocity: 100});
              if(!musicOn) break; 
            }
          }
      });

}

function loadXMLFeed(stock_name,start_date,finish_date){
  console.log(stock_name);
  console.log(start_date);
  console.log(finish_date);
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
    var max_vol = -1;
    var min_vol = 1000000;
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
              min_vol = volume<min_vol?volume:min_vol;
          }
          console.log('max_high: ' + max_high);
          console.log('min_low: ' + min_low);
          console.log('max_vol: ' + max_vol);
          let prevVol = min_vol;
          for (let i =0;i < days.length;i++){
              let open = days[i].open;
              let close = days[i].close;
              let low = days[i].low;
              let high = days[i].high;
              let volume = parseInt(days[i].volume);
              let pitch = getNote(3*(close-low)/(high-low),(volume-min_vol)/(max_vol-min_vol),0);
              console.log(pitch);
              midi.postMessage({type: 'note-on',pitch: pitch, velocity: 100});
              sleep(500);
              midi.postMessage({type: 'note-off',pitch: pitch, velocity: 100});
              if(!musicOn) break; 
          }

    });
}
