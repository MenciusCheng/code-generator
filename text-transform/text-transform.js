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

    new ClipboardJS('#copyResultButton');

    // 支持的转换器方法
    window.supportMethod = {
        scalaSqlTo,
        camelize
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