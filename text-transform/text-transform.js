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
        jiancheng
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
        let jdbcValues = textArr[1].split("JdbcValue").filter(it=> /\((.+?)\)/.test(it)).map(it => "'" + /\((.+?)\)/.exec(it)[1] + "'")
        let result = sql

        jdbcValues.forEach(it => {
            result = result.replace("?", it)
        })
        return result;
    } else {
        return '转换失败'
    }
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
        if (execArray = /^\s*(\d+)\s*:\s*(optional\s+)?((?:list<)?\w+(?:>)?)\s+(\w+)\s*,?\s*$/.exec(line)) {
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