(function () {
    // 模板支持的普通方法
    window.supportMethod = {
        camelize,
        underScore,
        upperFirst,
        lowerFirst,
        plural,
        singular,
        upperFirstAndPlural,
        dataTypeToScala,
        dataTypeToThrift,
        addInt,
        minusInt,
        strReTail
    }
    // 模板支持的内置方法
    window.supportInterMethod = {
        addSeparatorComma,
        addSeparatorPlus,
        addSeparatorPlusForCF
    }
    // 支持的内置解析器
    window.supportParser = {
        parseSql,
        parseThrift
    }

    $('#parseSqlButton').bind("click", function (event) {
        let sqlText = $('#sqlTextArea').val()
        let parser = window.supportParser[$("#parserSelect").val()]
        let obj = parser(sqlText)
        console.log(obj)

        let textArr = []
        let templateArr = $('#templateTextArea').val().split("\n")
        transform(textArr, obj, templateArr);
        // console.log(textArr)
        // let text = textArr.join("\n")

        let resultArr = []
        let resultObj = { subArr: [] }
        for (let index = 0; index < textArr.length; index++) {
            const element = textArr[index];
            if (/^file:([\w\.\-]+)/.exec(element)) {
                resultObj = { 
                    fileName: /^file:([\w\.\-]+)/.exec(element)[1],
                    subArr: []
                }
                resultArr.push(resultObj)
            } else {
                resultObj.subArr.push(element)
            }
        }

        console.log(resultArr)

        removeAllResultTextArea()
        for (let index = 0; index < resultArr.length; index++) {
            const element = resultArr[index];
            $(getResultTextArea(index, element.fileName)).appendTo($("#editor"))
            $('#resultTextArea' + index).val(element.subArr.join("\n"))
            new ClipboardJS('#copyResultButton' + index)
        }
    })

    $('#templateSelect').bind("change", function (event) {
        let template = window.supportTemplate[event.target.value]
        $('#templateTextArea').val(template)
    })

    $('#templateTextArea').val(window.supportTemplate["bigTemplate"])
    let initSql = "@=[soaName,productdb]\n@=[datasouce,ProductDB]\n"
    $('#sqlTextArea').val(initSql)
})();


function getResultTextArea(id, fileName) {
    return `<div class="col resultTextArea">
        <div><span>${fileName}</span></div>
        <div>
            <textarea name="resultTextArea${id}" id="resultTextArea${id}" cols="90" rows="30" wrap="off"></textarea>
        </div>
        <div>
            <button id="copyResultButton${id}" data-clipboard-target="#resultTextArea${id}">复制</button>&nbsp;&nbsp;&nbsp;&nbsp;<span>${fileName}</span>
        </div>
    </div>`;
}

function removeAllResultTextArea() {
    $(".resultTextArea").remove()
}