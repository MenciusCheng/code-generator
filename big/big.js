(function () {
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

    let initSql = "@=[soaName,productdb]\n@=[datasource,ProductDB]\n"
    $('#sqlTextArea').val(initSql)

    // 自定义模板
    let bigDiyArray = ['big-diy1', 'big-diy2', 'big-diy3']
    $('#templateTextArea').bind("change", function (event) {
        let selectValue = $('#templateSelect').val()
        if (bigDiyArray.some(a => a == selectValue)) {
            console.log(new Date() + ": 自定义模板 " + selectValue + " 自动保存成功！")
            localStorage.setItem(selectValue, event.target.value)
            window.supportTemplate[selectValue] = event.target.value
        }
    })
    bigDiyArray.forEach(a => {
        if (localStorage.getItem(a)) {
            window.supportTemplate[a] = localStorage.getItem(a)
        }
    })
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