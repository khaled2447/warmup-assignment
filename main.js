const { time, log } = require("console");
const fs = require("fs");

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
        const parts = line.split(',');
        if (parts[0] === shiftObj.driverID && parts[2] === shiftObj.date) {
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
    const newLine = `${shiftObj.driverID},${shiftObj.name},${shiftObj.date},${shiftObj.startTime},${shiftObj.endTime},${shiftduration},${idletime},${activetime},${metquota},${bonus}\n`;
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
    updatedfile = fs.readFileSync(textFile, 'utf-8').split('\n').map(line => {
        let fields = line.split(',')
        if(driverID === fields[0].trim()&& date === fields[2].trim()){
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
    numOfBonuses = 0
    let file = fs.readFileSync(textFile, "utf-8")
    let lines = file.split('\n')
    for(let i = 0; i<lines.length;i++){
        let parts = lines[i].split(',')
        if(parts[0]==driverID&&parseInt((parts[2].split('-'))[1])==month){
            if(parts[parts.length-1].trim()=='true')
                numOfBonuses++;
        }
    }
    if(numOfBonuses==0)
        return -1;
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
    hours = 0
    let file = fs.readFileSync(textFile, "utf-8")
    let lines = file.split('\n')
    for(let i = 0; i<lines.length;i++){
        let parts = lines[i].split(',')
        if(parts[0]==driverID&&parseInt((parts[2].split('-'))[1])==month){
            hours += getActiveTime(getShiftDuration(parts[3],parts[4]), getIdleTime(parts[3],parts[4]))
        }
    }
    if(numOfBonuses==0)
        return -1;
    return numOfBonuses
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
    // TODO: Implement this function
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
    // TODO: Implement this function
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
