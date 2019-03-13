
// 解析创建表 SQL 为一个对象
function parseSql(sql) {
    function createRow() {
        return {
            fieldName: "",
            dataType: "", // string, int, timestamp, double
            isOptional: false,
            fieldComment: "",
            isPrimaryKey: false,
            isUniqueKey: false
        }
    }
    let rows = []
    let obj = {
        tableName: "",
        tableComment: "",
        rows
    }
    let execArray = null

    sql.split("\n").forEach(line => {

        if (execArray = /^CREATE TABLE `(\w+)`/i.exec(line)) {
            // 匹配表名
            obj.tableName = singular(camelize(execArray[1]))
        } else if (execArray = /COMMENT=\'(.+)\';$/.exec(line)) {
            // 匹配表备注
            obj.tableComment = execArray[1]
        } else if (execArray = /^\s*`(\w+)`/.exec(line)) {
            // 匹配表字段
            let row = createRow()
            row.fieldName = camelize(execArray[1])

            if (/\svarchar\(\d+\)/.test(line) || /\schar\(\d+\)/.test(line)) {
                row.dataType = "string"
            } else if (/\sint\(\d+\)/.test(line) || /\ssmallint\(\d+\)/.test(line) || /\stinyint\(\d+\)/.test(line)) {
                row.dataType = "int"
            } else if (/\stimestamp/.test(line) || /\sdatetime/.test(line)) {
                row.dataType = "timestamp"
            } else if (/\sdecimal\(\d+,\d+\)/.test(line)) {
                row.dataType = "double"
            }

            row.isOptional = line.indexOf(" NOT NULL") === -1

            let matchComment = /COMMENT \'(.+)\'/i.exec(line)
            row.fieldComment = matchComment ? matchComment[1] : ''

            rows.push(row)
        } else if (execArray = /^\s*PRIMARY KEY \(`(\w+)`\)/.exec(line)) {
            // 匹配主键
            let fieldName = camelize(execArray[1])
            let row = rows.find(r => r.fieldName === fieldName)
            if (row) { row.isPrimaryKey = true }
        } else if (execArray = /^\s*UNIQUE KEY[`\w\s]* \(`(\w+)`\)/.exec(line)) {
            // 匹配唯一索引
            let fieldName = camelize(execArray[1])
            let row = rows.find(r => r.fieldName === fieldName)
            if (row) { row.isUniqueKey = true }
        } else if (execArray = /^@=\[(\w+),(.+)\]$/.exec(line)) {
            // 匹配自定义变量
            obj[execArray[1]] = execArray[2]
        }
    })

    return obj
}

// 解析 Thrift struct 为一个对象
function parseThrift(text) {
    function createRow() {
        return {
            fieldName: "",
            dataType: "",
            isOptional: false
        }
    }
    let rows = []
    let obj = {
        tableName: "",
        rows
    }
    let execArray = null

    text.split("\n").forEach(line => {
        if (execArray = /^struct (\w+)/.exec(line)) {
            obj.tableName = execArray[1]
        } else if (execArray = /^\s+\d\s*:(\s+optional)?\s+(\w+)\s+(\w+)/.exec(line)) {
            let row = createRow()
            row.fieldName = execArray[3]
            row.dataType = execArray[2]
            row.isOptional = !!execArray[1]
            rows.push(row)
        }
    })

    return obj
}

// 通过模板格式来渲染对象
function transform(textArr, obj, templateArr) {
    for (let i = 0; i < templateArr.length; i++) {
        const templateLine = templateArr[i];
        let matchFor = /^\s*=\[FOR,(\w+)\]$/.exec(templateLine)
        if (matchFor) {
            let tempArr = [];
            i += 1;
            while (!/^\s*=\[FOREND\]$/.test(templateArr[i])) {
                tempArr.push(templateArr[i]);
                i += 1;
            }
            let arr = obj[matchFor[1]]
            arr.forEach((v, k) => {
                let value = Object.assign({forIndex: k + 1, forLength: arr.length}, obj, v)
                transform(textArr, value, tempArr)
            })
        } else {
            let el =
                templateLine
                    .replace(/=\[IF,(\w+)\](.+?)\[IFEND\]/g, (_, field, str) => obj[field] ? str : '')
                    .replace(/=\[SEP,(\w+)\]/g, (_, fn) => window.supportInterMethod[fn] ? window.supportInterMethod[fn](obj) : '')
                    .replace(/=\[(\w+)\]/g, (_, field) => obj[field])
                    .replace(/=\[(\w+),(\w+)\]/g, (_, fn, field) => window.supportMethod[fn] ? window.supportMethod[fn](obj[field]) : '')
            textArr.push(el);
        }
    }
}


// ========= 支持的方法 ========= 

// 下划线转驼峰
function camelize(str) {
    const camelizeRE = /_(\w)/g
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
}

// 驼峰转下划线
function underScore(str) {
    const underScoreRE = /([a-z])([A-Z])/g
    return str ? str.replace(underScoreRE, (_, a, c) => c ? a + '_' + c.toLowerCase() : '') : str
}

// 首字母转大写
function upperFirst(str) {
    return str ? str[0].toUpperCase() + str.slice(1, str.length) : str
}

// 首字母转小写
function lowerFirst(str) {
    return str ? str[0].toLowerCase() + str.slice(1, str.length) : str
}

// 单词转复数
function plural(str) {
    return pluralize.plural(str)
}

// 单词转单数
function singular(str) {
    return pluralize.singular(str)
}

// 首字母转大写并且转成复数
function upperFirstAndPlural(str) {
    return upperFirst(plural(str))
}

// 把数据类型转换为Scala的类型
// 数据类型: string, int, timestamp, double
// Scala的类型: String, Int, LocalDateTime, BigDecimal
function dataTypeToScala(str) {
    let types = ['string','int','timestamp','double']
    let scalaTypes = ['String','Int','LocalDateTime','BigDecimal']
    for (let i = 0; i < types.length; i++) {
        if (types[i] == str) {
            return scalaTypes[i]
        }
    }
    return ''
}

// 把数据类型转换为Thrift的类型
// 数据类型: string, int, timestamp, double
// Scala的类型: String, Int, LocalDateTime, BigDecimal
function dataTypeToThrift(str) {
    let types = ['string','int','timestamp','double']
    let scalaTypes = ['string','i32','i64','double']
    for (let i = 0; i < types.length; i++) {
        if (types[i] == str) {
            return scalaTypes[i]
        }
    }
    return ''
}

// 增加逗号分隔符
function addSeparatorComma(obj) {
    return obj.forIndex == obj.forLength ? '' : ','
}

(function () {
    // 模板支持的普通方法
    window.supportMethod = {
        camelize,
        underScore,
        upperFirst,
        lowerFirst,
        plural,
        singular,
        dataTypeToScala,
        dataTypeToThrift,
        upperFirstAndPlural
    }
    // 模板支持的内置方法
    window.supportInterMethod = {
        addSeparatorComma
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

        let textArr = [];
        let templateArr = $('#templateTextArea').val().split("\n");
        transform(textArr, obj, templateArr);
        $('#resultTextArea').val(textArr.join("\n"));
    })

    $('#templateSelect').bind("change", function (event) {
        let template = window.supportTemplate[event.target.value]
        $('#templateTextArea').val(template)
    })

    $('#templateTextArea').val(window.supportTemplate["thriftTemplate"])

    new ClipboardJS('#copyResultButton');
})();