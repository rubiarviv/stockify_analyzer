function arraysIdentical(a, b) {
    var i = a.length;
    if (i != b.length) return false;
    while (i--) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

function MIDITime(tempo, seconds_per_year, base_octave, octave_range){
        console.log("MIDITime");
        this.tempo = tempo;
        this.tracks = [];
        // this.epoch = datetime.datetime(1970, 1, 1)
        this.seconds_per_year = seconds_per_year;
        this.base_octave = base_octave;
        this.octave_range = octave_range;
        this.note_chart = [["C"], ["C#", "Db"], ["D"], ["D#", "Eb"], ["E"], ["F"], ["F#", "Gb"], ["G"], ["G#", "Ab"], ["A"], ["A#", "Bb"], ["B"]];
}

MIDITime.prototype.beat = function (numdays){
    let beats_per_second = this.tempo / 60.0;
    let beats_per_datayear = this.seconds_per_year * beats_per_second;
    let beats_per_dataday = beats_per_datayear / 365.25;

    return Math.round(beats_per_dataday * numdays);
}


    // def days_since_epoch(self, input):
    //     normalized_epoch = this.normalize_datetime(input, this.epoch)
    //     return (input - normalized_epoch).total_seconds() / 60 / 60 / 24  # How many days, with fractions

    // def map_week_to_day(self, year, week_num, desired_day_num=None):
    //     ''' Helper for weekly data, so when you jump to a new year you don't have notes playing too close together. Basically returns the first Sunday, Monday, etc. in 0-indexed integer format that is in that week.

    //     Usage: Once without a desired_day_num, then feed it a day_num in the loop

    //     Example:
    //     first_day = this.map_week_to_day(filtered_data[0]['Year'], filtered_data[0]['Week'])

    //     for r in filtered_data:
    //         # Convert the week to a date in that week
    //         week_start_date = this.map_week_to_day(r['Year'], r['Week'], first_day.weekday())
    //         # To get your date into an integer format, convert that date into the number of days since Jan. 1, 1970
    //         days_since_epoch = this.mymidi.days_since_epoch(week_start_date)

    //     '''
    //     year_start = datetime.datetime(int(year), 1, 1).date()
    //     year_start_day = year_start.weekday()
    //     week_start_date = year_start + datetime.timedelta(weeks=1 * (int(week_num) - 1))
    //     week_start_day = week_start_date.weekday()
    //     if desired_day_num and week_start_day < desired_day_num:
    //         return week_start_date + datetime.timedelta(days=(desired_day_num - week_start_day))
    //     return week_start_date

    MIDITime.prototype.get_data_range = function(data_list){
        let max_high = -1;
        let min_low = 1000000;
        for (let i =0;i < data_list.length;i++){
            // let date = days[i].date;
            // let open = days[i].open;
            let high = parseInt(data_list[i].close);
            let low = parseInt(data_list[i].close);
            max_high = high>max_high?high:max_high;
            min_low = low<min_low?low:min_low;
            // let close = history.history.day[i].close;
            // let volume = parseInt(days[i].volume);
            // max_vol = volume>max_vol?volume:max_vol;
            // min_vol = volume<min_vol?volume:min_vol;
        }

        return [min_low, max_high];
    }
    MIDITime.prototype.scale_to_note_classic = function(scale_pct, mode){
        let full_mode = [];
        let n = 0;
        while (n < this.octave_range){
            for(let m in mode){
                let current_octave = (this.base_octave + (n * 1)).toString();
                full_mode.push(mode[m] + current_octave);
            }
            n += 1;
        }
        let index = Number.parseFloat((scale_pct * full_mode.length).toString()).toFixed();
        if (index >= full_mode.length){ 
            index = full_mode.length - 1;
        }
        console.log(full_mode[index]);
        return full_mode[index];
    }

    MIDITime.prototype.scale_to_note = function(scale_pct, mode){
        let full_c_haystack = [];
        let n = 0;
        while (n < this.octave_range){
            for(let note_group_i in this.note_chart){
                let note_group=this.note_chart[note_group_i];
                let out_group = [];
                for(let note_i in note_group){
                    let note = note_group[note_i];
                    let current_octave = this.base_octave + (n * 1);
                    out_group.push(note + current_octave.toString());
                }
                full_c_haystack.push(out_group);
            }
            n+=1;
        }
        let full_mode = []
        n = 0
        while(n < this.octave_range){
            for(let note_i in mode){
                let note = mode[note_i];
                let note_key = null;
                let groupkey=0;
                let note_found = false;
                for(let group_i in full_c_haystack){
                    let group = full_c_haystack[group_i];
                    for(let gnote_i in group){
                        let gnote = group[gnote_i];
                        let sub_gnote = gnote.slice(0,gnote.length-1);
                        // if (gnote[:-1] == note){ 
                        if (arraysIdentical(sub_gnote,note)){
                            full_mode.push(gnote);
                            note_found = true;
                            note_key = groupkey;
                        }
                    }
                    if (note_found == true){
                        break;
                    }
                    groupkey++;
                }
                
                full_c_haystack.splice(note_key,1);
                // full_c_haystack[note_key:];
            }
            n+=1;
        }
        let index = Number.parseFloat((scale_pct * full_mode.length).toString()).toFixed();
        if (index >= full_mode.length){
            index = full_mode.length - 1;
        }
        return full_mode[index]
    }

    MIDITime.prototype.note_to_midi_pitch = function(notename){
        let midinum = 0;
        let letter = notename.slice(0,notename.length-1);
        let octave = notename[notename.length-1];

        let i = 0;
        for (let note_i in this.note_chart)    {
            let note = this.note_chart[note_i];
            for (let form in note)    {
                if (arraysIdentical(letter,note[form]))
                {
                    midinum = i;
                    break;
                }
            }
            i += 1;
        }
        midinum += octave * 12;
        return midinum;
    }

    MIDITime.prototype.linear_scale_pct = function(domain_min, domain_max, input, reverse=false){
        let domain_range = domain_max - domain_min;
        let domain_pct = (input - domain_min) / domain_range;

        if(reverse)
            domain_pct = 1 - domain_pct;
        return domain_pct;
    }
    
    MIDITime.prototype.scale = function(range_min, range_max, input_pct){
        let scale_range = range_max - range_min;
        return range_min + (input_pct * scale_range);
    }

    export let miditime = new MIDITime(120, 5, 5, 2);
    export let get_data_range = MIDITime.get_data_range;
    export let linear_scale_pct = MIDITime.linear_scale_pct;
    export let scale_to_note = MIDITime.scale_to_note;
    export let note_to_midi_pitch = MIDITime.note_to_midi_pitch;
    export let scale_to_note_classic = MIDITime.scale_to_note_classic;
