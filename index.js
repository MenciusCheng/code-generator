(function () {
    $('#parseSqlButton').bind("click", function (event) {
        let sqlText = $('#sqlTextArea').val()
        let parser = window.supportParser[$("#parserSelect").val()]
        let obj = parser(sqlText)
        console.log(obj)

        let textArr = [];
        let templateArr = $('#templateTextArea').val().split("\n");

        if (Array.isArray(obj)) {
            obj.forEach(o => {
                transform(textArr, o, templateArr)
            })
        } else {
            transform(textArr, obj, templateArr)
        }
        
        $('#resultTextArea').val(textArr.join("\n"));
    })

    $('#templateSelect').bind("change", function (event) {
        let template = window.supportTemplate[event.target.value]
        $('#templateTextArea').val(template)
    })

    $('#templateTextArea').val(window.supportTemplate["thriftTemplate"])

    new ClipboardJS('#copyResultButton');

    // 自定义模板
    let commonDiyArray = ['common-diy1', 'common-diy2', 'common-diy3']
    $('#templateTextArea').bind("change", function (event) {
        let selectValue = $('#templateSelect').val()
        if (commonDiyArray.some(a => a == selectValue)) {
            console.log(new Date() + ": 自定义模板 " + selectValue + " 自动保存成功！")
            localStorage.setItem(selectValue, event.target.value)
            window.supportTemplate[selectValue] = event.target.value
        }
    })
    commonDiyArray.forEach(a => {
        if (localStorage.getItem(a)) {
            window.supportTemplate[a] = localStorage.getItem(a)
        }
    })
})();