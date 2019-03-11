/*
保留的属性名
forIndex
forLength
*/


// 解析创建表 SQL 为一个对象
function parseSql(sql) {
    function createRow() {
        return {
            fieldName: "",
            dataType: "", // string, int, timestamp, double
            isOptional: false,
            fieldComment: ""
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

        if (execArray = /^CREATE TABLE `([\w|_]+)`/i.exec(line)) {
            obj.tableName = singular(camelize(execArray[1]))
        } else if (execArray = /COMMENT=\'(.+)\';$/.exec(line)) {
            obj.tableComment = execArray[1]
        } else if (execArray = /^\s*`([\w|_]+)`/.exec(line)) {
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

            // if (/=\[IF,(\w+)\](.+)=\[IFEND\]/g.test(templateLine)) {
            //     debugger
            // }

            let el =
                templateLine
                    .replace(/=\[IF,(\w+)\](.+?)=\[IFEND\]/g, (_, field, str) => obj[field] ? str : '')
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
    return str.replace(underScoreRE, (_, a, c) => c ? a + '_' + c.toLowerCase() : '')
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

// 增加逗号分隔符
function addSeparatorComma(obj) {
    return obj.forIndex == obj.forLength ? '' : ','
}

// ========= 内置模板 ========= 

let thriftTemplate =
`/**
* =[tableComment]
**/
struct T=[upperFirst,tableName] {
=[FOR,rows]
    /**
    * =[fieldComment]
    **/
    =[forIndex]: =[dataType] =[fieldName]
=[FOREND]
}
`;

let caseClassTemplate =
`case class =[upperFirst,tableName] ( 
=[FOR,rows]
/** =[fieldComment] */ 
=[fieldName]: =[IF,isOptional]Option[=[IFEND]=[dataTypeToScala,dataType]=[IF,isOptional]]=[IFEND]=[SEP,addSeparatorComma]
=[FOREND]
) 	
    
object =[upperFirst,tableName] extends SnakifiedSprayJsonSupport{
    implicit val =[tableName]Format = jsonFormat16(=[upperFirst,tableName].apply)
        implicit val resultSetMapper: ResultSetMapper[=[upperFirst,tableName]] = ResultSetMapper.material[=[upperFirst,tableName]]
}
`;

(function () {
    // 模板支持的普通方法
    window.supportMethod = {
        camelize,
        underScore,
        upperFirst,
        lowerFirst,
        plural,
        singular,
        dataTypeToScala
    }
    // 模板支持的内置方法
    window.supportInterMethod = {
        addSeparatorComma
    }

    $('#parseSqlButton').bind("click", function (event) {
        let obj = parseSql($('#sqlTextArea').val())
        console.log(obj)

        let textArr = [];
        let templateArr = $('#templateTextArea').val().split("\n");
        transform(textArr, obj, templateArr);
        $('#resultTextArea').val(textArr.join("\n"));
    })

    $('#templateSelect').bind("change", function (event) {
        if (event.target.value == "thrift") {
            $('#templateTextArea').val(thriftTemplate)
        } else if (event.target.value == "case class") {
            $('#templateTextArea').val(caseClassTemplate)
        }
    })

    $('#templateTextArea').val(thriftTemplate)

    new ClipboardJS('#copyResultButton');
})();