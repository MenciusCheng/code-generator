$(document).ready(function () {
    $('#resetButton').bind("click", function (event) {
        $('#originTextArea').val('')
        $('#resultTextArea').val('')
        $('#originTextArea').focus()
    })

    $('#transformerSelect').bind("change", function (event) {
        let text = $('#originTextArea').val()
        if (text) {
            doTransformAction(text)
        }
    })

    $('#originTextArea').bind("change", function (event) {
        if (event.target.value) {
            doTransformAction(event.target.value)
        }
    })

    $('#originTextArea').bind("keydown", function (event) {
        // Ctrl + V
        if (event.ctrlKey && event.key.toLowerCase() == "v") {
            setTimeout(function () {
                let text = $('#originTextArea').val()
                doTransformAction(text)
            }, 100)
        }
    })

    $('body').bind("keydown", function (event) {
        // Ctrl + Shift + C
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() == "c") {
            $('#copyResultButton').click()
        }
    })

    new ClipboardJS('#copyResultButton');

    // 支持的转换器方法
    window.supportMethod = {
        scalaSqlTo,
        camelize,
        refreshThriftStructIndex,
        jiancheng,
        areaCommon
    }
})

function doTransformAction(text) {
    // 当前选择的转换方法
    let ftn = window.supportMethod[$('#transformerSelect').val()]

    if (typeof ftn === "function") {
        // 转换结果
        $('#resultTextArea').val(ftn(text))
    } else {
        console.log('该方法不是函数，转换失败')
    }
}

// Scala SQL 日志转 SQL
function scalaSqlTo(str) {
    let textArr = $('#originTextArea').val().split('args:')
    if (textArr.length > 1 && textArr[0] && textArr[1]) {
        let sql = textArr[0]
        let value = textArr[1]
        let valueArray = []

        if (value.indexOf("JdbcValue") > -1) {
            valueArray = reJdbcValue(value)
        } else if (value.indexOf("ArrayBuffer") > -1) {
            valueArray = reArrayBuffer(value)
        }

        let result = sql
        valueArray.forEach(it => {
            result = result.replace("?", it)
        })
        return result;
    } else {
        return '转换失败'
    }
}

// WrappedArray(JdbcValue(6), JdbcValue(40)) => ["'6'", "'40'"]
function reJdbcValue(str) {
    return str.split("JdbcValue").filter(it=> /\((.*?)\)/.test(it)).map(it => "'" + /\((.*?)\)/.exec(it)[1] + "'")
}

// ArrayBuffer(2121, 1) => ["'2121'", "'1'"]
function reArrayBuffer(str) {
    return /\((.*?)\)/.exec(str)[1].split(',').map(it => "'" + it.trim() + "'")
}

// 下划线转驼峰
function camelize(str) {
    const camelizeRE = /_(\w)/g
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
}

// 更新 thrift struct 的序号
function refreshThriftStructIndex(str) {
    let execArray = []
    let index = 0

    let strArray = str.split("\n").map(line => {
        if (execArray = /^\s*(\d+)\s*:/.exec(line)) {
            let matchIndex = execArray[1]
            index += 1
            return line.replace(matchIndex, index)
        } else {
            return line
        }
    })

    return strArray.join("\n")
}

// 世界各国简称
function jiancheng(str) {
    let arr = str.split("\n").map(line => {
        let execArray
        if (execArray = /([\u4E00-\u9FA5]+)\s+(\b[\w\s]+\b)\s+(\b\w+\b)\s+([\u4E00-\u9FA5]+)\s+(\b[\w\s]+\b)/.exec(line)) {
            return `${execArray[1]}\t${execArray[2]}\t${execArray[3]}\t${execArray[4]}\t${execArray[5]}`
        } else {
            return ""
        }
    }).filter(it => it.length > 0)
    console.log(arr)
    return arr.join("\n")
}

// 路线地址
function areaCommon(str) {
    let arr = str.split("\n").map(line => {
        let execArray
        if (execArray = /(.+)\t(.+)\t(.+)\t(.+)\t(.+)\t(.+)\t(.+)\t(.+)\t(.+)\t(.+)\t(.+)/.exec(line)) {

            let price_1st_phase = 0
            let cost_1st_phase = 0
            let price_2st_phase = 0
            let cost_2st_phase = 0
            let price_3st_phase = 0
            let cost_3st_phase = 0
            let price_4st_phase = 0
            let cost_4st_phase = 0
            let price_5st_phase = 0
            let cost_5st_phase = 0
            let price_6st_phase = 0
            let cost_6st_phase = 0
            let price_7st_phase = 0
            let cost_7st_phase = 0
            let price_8st_phase = 0
            let cost_8st_phase = 0

            let destinationName = execArray[2]
            let _1st_phase = execArray[4]
            if (_1st_phase.trimStart().startsWith("吨位价")) {
                price_1st_phase = /\d+/.exec(_1st_phase)[0]
            } else if (_1st_phase.trimStart().startsWith("整车价")) {
                cost_1st_phase = /\d+/.exec(_1st_phase)[0]
            } else {
                console.error("格式有误")
            }

            let _2st_phase = execArray[5]
            if (_2st_phase.trimStart().startsWith("吨位价")) {
                price_2st_phase = /\d+/.exec(_2st_phase)[0]
            } else if (_2st_phase.trimStart().startsWith("整车价")) {
                cost_2st_phase = /\d+/.exec(_2st_phase)[0]
            } else {
                console.error("格式有误")
            }

            let _3st_phase = execArray[6]
            if (_3st_phase.trimStart().startsWith("吨位价")) {
                price_3st_phase = /\d+/.exec(_3st_phase)[0]
            } else if (_3st_phase.trimStart().startsWith("整车价")) {
                cost_3st_phase = /\d+/.exec(_3st_phase)[0]
            } else {
                console.error("格式有误")
            }

            let _4st_phase = execArray[7]
            if (_4st_phase.trimStart().startsWith("吨位价")) {
                price_4st_phase = /\d+/.exec(_4st_phase)[0]
            } else if (_4st_phase.trimStart().startsWith("整车价")) {
                cost_4st_phase = /\d+/.exec(_4st_phase)[0]
            } else {
                console.error("格式有误")
            }

            let _5st_phase = execArray[8]
            if (_5st_phase.trimStart().startsWith("吨位价")) {
                price_5st_phase = /\d+/.exec(_5st_phase)[0]
            } else if (_5st_phase.trimStart().startsWith("整车价")) {
                cost_5st_phase = /\d+/.exec(_5st_phase)[0]
            } else {
                console.error("格式有误")
            }

            let _6st_phase = execArray[9]
            if (_6st_phase.trimStart().startsWith("吨位价")) {
                price_6st_phase = /\d+/.exec(_6st_phase)[0]
            } else if (_6st_phase.trimStart().startsWith("整车价")) {
                cost_6st_phase = /\d+/.exec(_6st_phase)[0]
            } else {
                console.error("格式有误")
            }

            let _7st_phase = execArray[10]
            if (_7st_phase.trimStart().startsWith("吨位价")) {
                price_7st_phase = /\d+/.exec(_7st_phase)[0]
            } else if (_7st_phase.trimStart().startsWith("整车价")) {
                cost_7st_phase = /\d+/.exec(_7st_phase)[0]
            } else {
                console.error("格式有误")
            }

            let _8st_phase = execArray[11]
            if (_8st_phase.trimStart().startsWith("吨位价")) {
                price_8st_phase = /\d+/.exec(_8st_phase)[0]
            } else if (_8st_phase.trimStart().startsWith("整车价")) {
                cost_8st_phase = /\d+/.exec(_8st_phase)[0]
            } else {
                console.error("格式有误")
            }

            return `("4406", "${destinationName}", ${price_1st_phase}, ${cost_1st_phase}, ${price_2st_phase}, ${cost_2st_phase}, ${price_3st_phase}, ${cost_3st_phase}, ${price_4st_phase}, ${cost_4st_phase}, ${price_5st_phase}, ${cost_5st_phase}, ${price_6st_phase}, ${cost_6st_phase}, ${price_7st_phase}, ${cost_7st_phase}, ${price_8st_phase}, ${cost_8st_phase}),`
        } else {
            return ""
        }
    }).filter(it => it.length > 0)
    console.log(arr)
    return arr.join("\n")
}