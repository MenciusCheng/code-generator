// 解析创建表 SQL 为一个对象
function parseSql(sql) {
    function createRow() {
        return {
            fieldName: "",
            dataType: "", // string, int, timestamp, double
            isOptional: false,
            fieldComment: "",
            isPrimaryKey: false, // 是否主键
            isUniqueKey: false, // 是否唯一键
            isCommonField: false // 通用字段，除了主键和创建修改信息字段
        }
    }
    let rows = []
    let obj = {
        tableName: "",
        tableComment: "",
        rows,
        primaryKeyName: "",
        primaryKeyDataType: ""
    }
    let execArray = null
    let uncommonFieldList = ["createdAt","createdBy","updatedAt","updatedBy"]

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

            row.isCommonField = !uncommonFieldList.some(e => e === row.fieldName)

            rows.push(row)
        } else if (execArray = /^\s*PRIMARY KEY \(`(\w+)`\)/.exec(line)) {
            // 匹配主键
            let fieldName = camelize(execArray[1])
            let row = rows.find(r => r.fieldName === fieldName)
            if (row) { 
                row.isPrimaryKey = true
                row.isCommonField = false // 把主键移出通用字段
                obj.primaryKeyName = row.fieldName
                obj.primaryKeyDataType = row.dataType
            }
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
        let execArray = null
        if (execArray = /^\s*=\[IFM,(\w+)\]\s*/.exec(templateLine)) {
            // 多行 If
            let tempArr = [];
            i += 1;
            while (!/^\s*=\[IFMEND\]\s*/.test(templateArr[i])) {
                tempArr.push(templateArr[i]);
                i += 1;
            }
            if (obj[execArray[1]]) {
                transform(textArr, obj, tempArr)
            }
        } else if (execArray = /^\s*=\[FOR,(\w+)\]\s*/.exec(templateLine)) {
            // For 循环
            let tempArr = [];
            i += 1;
            while (!/^\s*=\[FOREND\]\s*/.test(templateArr[i])) {
                tempArr.push(templateArr[i]);
                i += 1;
            }
            let arr = obj[execArray[1]]
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
                    .replace(/=\[(\w+),(\w+),(\w+)\]/g, (_, fn, field, param) => window.supportMethod[fn] ? window.supportMethod[fn](obj[field],param) : '')
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

// 增加逗号分隔符，循环体里使用
function addSeparatorComma(obj) {
    return obj.forIndex == obj.forLength ? '' : ','
}

// 增加加号分隔符，循环体里使用
function addSeparatorPlus(obj) {
    return obj.forIndex == obj.forLength ? '' : '+'
}

// 增加加号分隔符，通用字段的循环体使用
function addSeparatorPlusForCF(obj) {
    return obj.forIndex >= (obj.forLength - 4) ? '' : '+'
}

// 整数相加
function addInt(a, b) {
    return parseInt(a) + parseInt(b)
}

// 整数相减
function minusInt(a, b) {
    return parseInt(a) - parseInt(b)
}

// 去掉字符串最后一个字符
function strReTail(str) {
    return str ? str.slice(0, str.length - 1) : ''
}