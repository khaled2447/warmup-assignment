const { time, log } = require("console");
const fs = require("fs");
const { text } = require("stream/consumers");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    let totalSecondsStart = stringToSeconds(startTime);
    let totalSecondsEnd = stringToSeconds(endTime);
    let totaltime = secondsToString(totalSecondsEnd-totalSecondsStart)
    return totaltime
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    let totalSecondsStart = stringToSeconds(startTime);
    let totalSecondsEnd = stringToSeconds(endTime);
    let totaltime = 0;
    if(totalSecondsStart<28800){
        totaltime+=28800-totalSecondsStart;
    }
    if(totalSecondsEnd>79200){
        totaltime+=totalSecondsEnd-79200;
    }

    let totalTimeString = secondsToString(totaltime);
    return totalTimeString;
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    let totalSecondsShift = stringToSeconds(shiftDuration);
    let totalSecondsIdle = stringToSeconds(idleTime);
    let totaltime = secondsToString(totalSecondsShift-totalSecondsIdle)
    return totaltime
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    const dateNum = date.split('-').map(Number);
    let activeTimeint = stringToSeconds(activeTime);
    if(dateNum[1]==4){
        if(dateNum[2]>=10&&dateNum[2]<=30){
            if(activeTimeint>=6*3600){
                return true;
            }else{
                return false;
            }
        }
    }
    if(activeTimeint>=8*3600+24*60){
        return true;
    }
    return false;

}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
   const fileContent = fs.readFileSync(textFile, 'utf8');
    const lines = fileContent.split('\n');
    for (let line of lines) {
        if(!line.trim()) continue;
        const parts = line.split(',');
        if (parts[0].trim() === shiftObj.driverID && parts[2].trim() === shiftObj.date) {
            return {};
        }
    }
    let shiftduration = getShiftDuration(shiftObj.startTime,shiftObj.endTime)
    let idletime = getIdleTime(shiftObj.startTime,shiftObj.endTime)
    let activetime = getActiveTime(shiftduration,idletime)
    let metquota = metQuota(shiftObj.date,activetime)
    let bonus = false
const newEntry = {
    driverID: shiftObj.driverID,
    driverName: shiftObj.driverName,
    date: shiftObj.date,
    startTime: shiftObj.startTime,
    endTime: shiftObj.endTime,
    shiftDuration: shiftduration,
    idleTime: idletime,
    activeTime: activetime,
    metQuota: metquota,
    hasBonus: bonus
};
    const newLine = `${shiftObj.driverID},${shiftObj.driverName},${shiftObj.date},${shiftObj.startTime},${shiftObj.endTime},${shiftduration},${idletime},${activetime},${metquota},${bonus}\n`;
    addLine(textFile,newLine);
    return newEntry;
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    let updatedfile = fs.readFileSync(textFile, 'utf-8').split('\n').map(line => {
        let fields = line.split(',')
        if(driverID.trim() === fields[0].trim()&& date.trim() === fields[2].trim()){
            fields[fields.length-1] = `${newValue}`
            return fields.join(',')
        }
    return line
    })
    fs.writeFileSync(textFile, updatedfile.join('\n'), 'utf-8')
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    let numOfBonuses = 0
    let  driverexists = false
    let file = fs.readFileSync(textFile, "utf-8")
    let lines = file.split('\n')
    for(let i = 0; i<lines.length;i++){
        if(!lines[i].trim()) continue;
        let parts = lines[i].split(',')
        if(parts[0].trim()==driverID.trim()){
            driverexists = true
            if(parseInt((parts[2].trim().split('-'))[1])==month)
            {
                if(parts[parts.length-1].trim()=='true'){
                    numOfBonuses++;
                }
            }
        }
    }
    if(!driverexists){
        return -1;
    }
    return numOfBonuses
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    let hours = 0
    let driverexists = false
    let file = fs.readFileSync(textFile, "utf-8")
    let lines = file.split('\n')
    for(let i = 0; i<lines.length;i++){
        if(!lines[i].trim()) continue;
        let parts = lines[i].split(',')
        if(parts[0].trim()==driverID.trim()){
            driverexists = true
            if(parseInt((parts[2].trim().split('-'))[1])==month){
                hours += stringToSeconds(parts[7].trim())
            }
        }
    }
    if(!driverexists)
        return -1;
    return secondsToString(hours)
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    let requiredhours = 0;
    let ratefile = fs.readFileSync(rateFile, 'utf-8')
    let file = fs.readFileSync(textFile,'utf-8')
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let dayoff = ""
    let rateFileLines = ratefile.split('\n')
    for(let i = 0; i<rateFileLines.length;i++){
        let rateParts = rateFileLines[i].split(',')
        if(driverID.trim()==rateParts[0].trim()){
            dayoff=rateParts[1].trim()
        }
    }
    
    let fileLines = file.split('\n')
    for(let i = 0; i<fileLines.length;i++){
        if (!fileLines[i].trim()) continue;
        let parts = fileLines[i].split(',');
        if(isNaN(new Date(parts[2].trim()).getDay())) continue;
        let dateparts = parts[2].trim().split('-')
        if(parts[0].trim()==driverID.trim() && new Date(parts[2].trim()).getDay() != days.indexOf(dayoff) && month==parseInt(dateparts[1])){
            if(parseInt(dateparts[1])==4 && parseInt(dateparts[2])>=10 && parseInt(dateparts[2])<=30){
                requiredhours += 6 * 3600
            }else{
                requiredhours += 8*3600+24*60
            }
        }
    }
    requiredhours -= bonusCount*2*3600
    return secondsToString(requiredhours)
    
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    let ratefile = fs.readFileSync(rateFile, 'utf-8');
    let rateFileLines = ratefile.split('\n');
    
    let basePay = 0;
    let tier = 0;

    for (let i = 0; i < rateFileLines.length; i++) {
        if (!rateFileLines[i].trim()) continue;
        let parts = rateFileLines[i].split(',');
        if (parts[0].trim() == driverID.trim()) {
            basePay = parseInt(parts[2].trim());
            tier = parseInt(parts[3].trim());
        }
    }

    const allowedMissing = {1: 50, 2: 20, 3: 10, 4: 3};

    let actualSeconds = stringToSeconds(actualHours);
    let requiredSeconds = stringToSeconds(requiredHours);

    if (actualSeconds >= requiredSeconds) return basePay;

    let missingSeconds = requiredSeconds - actualSeconds;
    let missingHours = missingSeconds / 3600;

    missingHours -= allowedMissing[tier];

    if (missingHours <= 0) return basePay;

    missingHours = Math.floor(missingHours); 

    let deductionRatePerHour = Math.floor(basePay / 185);
    let salaryDeduction = missingHours * deductionRatePerHour;

    return basePay - salaryDeduction;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};

function stringToSeconds(mohamed){
    const timesStart = mohamed.split(/[: ]/);
    
    let totalSecondsStart =  timesStart[1]*60 + Number(timesStart[2]);

    if(timesStart[3]=='pm'){
        if(timesStart[0]!=12){
            totalSecondsStart+=43200*1 + timesStart[0]*3600;
        }
        else{
            totalSecondsStart+=43200*1;
        }
    }else{
        if(timesStart[0]!=12){
            totalSecondsStart+=timesStart[0]*3600;
        }
    }

    return totalSecondsStart;
}

function secondsToString(timeInSeconds){
    let hours = Math.floor(timeInSeconds/3600)
    let minutes = Math.floor((timeInSeconds%3600)/60)
    let seconds = Math.floor(timeInSeconds%60)

    
    let timeString = `${hours}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
    return timeString;
}

function addLine(textfile,newdriver) {
    fs.appendFileSync(textfile, newdriver);
}
