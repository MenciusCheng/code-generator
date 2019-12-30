function createSqlRow() {
    return {
        fieldName: "", // 把下划线转为驼峰后的字段名
        fieldNameOrigin: "", // 未经过处理的字段名
        dataType: "", // string, int, timestamp, double
        isOptional: false,
        fieldComment: "",
        isPrimaryKey: false, // 是否主键
        isUniqueKey: false, // 是否唯一键
        isCommonField: false, // 通用字段，除了主键和创建修改信息字段
        isAutoIncrement: false, // 是否自增
        isDefault: false,
        isNotNeed: false,
        isDeletedKey: false
    }
}

function createSqlObj() {
    return {
        tableName: "", // 把下划线转为驼峰，复数转为单数后的字段名
        tableNameOrigin: "", // 未经过处理的表名
        tableComment: "",
        rows: [],
        primaryKeyName: "", // 主键名
        primaryKeyNameOrigin: "", // 未经过处理的主键名
        primaryKeyDataType: "",
        haveDisabledKey: false
    }
}

// 解析创建表 SQL 为一个对象
function parseSql(sql) {
    let obj = createSqlObj()
    let rows = []
    let execArray = null
    let uncommonFieldList = ["id","createdAt","createdBy","updatedAt","updatedBy","isDeleted"]
    // let uniqueCheckList = ["name"]

    sql.split("\n").forEach(line => {

        if (execArray = /^CREATE TABLE (?:`\w+`\.)?`(\w+)`/i.exec(line)) {
            // 匹配表名
            obj.tableName = singular(camelize(execArray[1]))
            obj.tableNameOrigin = execArray[1]
        } else if (/^\s*\)/.test(line) && (execArray = /COMMENT=\'(.+)\';?$/.exec(line))) {
            // 匹配表备注
            obj.tableComment = execArray[1]
        } else if (execArray = /^\s*`(\w+)`/.exec(line)) {
            // 匹配表字段
            let row = createSqlRow()
            row.fieldName = camelize(execArray[1])
            row.fieldNameOrigin = execArray[1]

            if (/\svarchar\(\d+\)/.test(line) || /\schar\(\d+\)/.test(line) || /\stext/.test(line) || /\senum\(/.test(line)) {
                row.dataType = "string"
            } else if (/\sint\(\d+\)/.test(line) || /\ssmallint\(\d+\)/.test(line) || /\stinyint\(\d+\)/.test(line)) {
                row.dataType = "int"
            } else if (/\stimestamp/.test(line) || /\sdatetime/.test(line)) {
                row.dataType = "timestamp"
            } else if (/\sdecimal\(\d+,\d+\)/.test(line)) {
                row.dataType = "double"
            }

            row.isTimestamp = row.dataType == "timestamp"

            // 是否不为空
            row.isOptional = line.indexOf(" NOT NULL") === -1
            // 是否有默认值
            row.isDefault = line.indexOf(" DEFAULT ") > -1
            // 创建时是否必填
            row.isNotNeed = row.isOptional || row.isDefault

            let matchComment = /COMMENT \'(.+)\'/i.exec(line)
            row.fieldComment = matchComment ? matchComment[1] : ''

            row.isCommonField = !uncommonFieldList.some(e => e === row.fieldName)

            row.isAutoIncrement = line.indexOf(" AUTO_INCREMENT") > -1

            if (row.fieldName == 'isDeleted') {
                row.isDeletedKey = true
            }

            // 符合指定名称的，会做唯一检查
            // if (uniqueCheckList.some(it => it == row.fieldName)) {
            //     row.isUniqueKey = true
            // }

            rows.push(row)
        } else if (execArray = /^\s*PRIMARY KEY \(`(\w+)`\)/.exec(line)) {
            // 匹配主键
            let fieldName = camelize(execArray[1])
            let row = rows.find(r => r.fieldName === fieldName)
            if (row) { 
                row.isPrimaryKey = true
                obj.primaryKeyName = row.fieldName
                obj.primaryKeyNameOrigin = row.fieldNameOrigin
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

    obj.rows = rows
    obj.commonFields = rows.filter(r => uncommonFieldList.every(u => u !== r.fieldName))
    obj.haveDisabledKey = rows.some(r => r.fieldName == "isDisabled")

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
        } else if (execArray = /^\s+\d+\s*:(\s+optional)?\s+(\w+)\s+(\w+)/.exec(line)) {
            let row = createRow()
            row.fieldName = execArray[3]
            row.dataType = execArray[2]
            row.isOptional = !!execArray[1]
            rows.push(row)
        }
    })

    return obj
}

// 解析创建表 SQL 为一个对象
function parseSqlList(sql) {
    let result = []
    let obj = createSqlObj()
    let diy = {}
    let rows = []
    let execArray = null
    let uncommonFieldList = ["id","createdAt","createdBy","updatedAt","updatedBy"]

    sql.split("\n").forEach(line => {

        if (execArray = /^CREATE TABLE (?:`\w+`\.)?`(\w+)`/i.exec(line)) {
            if (obj.tableName) {
                obj.rows = rows
                obj.commonFields = rows.filter(r => uncommonFieldList.every(u => u !== r.fieldName))
                result.push(obj)
                obj = createSqlObj()
            }
            
            // 匹配表名
            obj.tableName = singular(camelize(execArray[1]))
            obj.tableNameOrigin = execArray[1]
        } else if (execArray = /COMMENT=\'(.+)\';$/.exec(line)) {
            // 匹配表备注
            obj.tableComment = execArray[1]
        } else if (execArray = /^\s*`(\w+)`/.exec(line)) {
            // 匹配表字段
            let row = createSqlRow()
            row.fieldName = camelize(execArray[1])
            row.fieldNameOrigin = execArray[1]

            if (/\svarchar\(\d+\)/.test(line) || /\schar\(\d+\)/.test(line) || /\stext/.test(line)) {
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

            row.isAutoIncrement = line.indexOf(" AUTO_INCREMENT") > -1

            rows.push(row)
        } else if (execArray = /^\s*PRIMARY KEY \(`(\w+)`\)/.exec(line)) {
            // 匹配主键
            let fieldName = camelize(execArray[1])
            let row = rows.find(r => r.fieldName === fieldName)
            if (row) { 
                row.isPrimaryKey = true
                obj.primaryKeyName = row.fieldName
                obj.primaryKeyNameOrigin = row.fieldNameOrigin
                obj.primaryKeyDataType = row.dataType
            }
        } else if (execArray = /^\s*UNIQUE KEY[`\w\s]* \(`(\w+)`\)/.exec(line)) {
            // 匹配唯一索引
            let fieldName = camelize(execArray[1])
            let row = rows.find(r => r.fieldName === fieldName)
            if (row) { row.isUniqueKey = true }
        } else if (execArray = /^@=\[(\w+),(.+)\]$/.exec(line)) {
            // 匹配自定义变量
            diy[execArray[1]] = execArray[2]
        }
    })

    obj.rows = rows
    obj.commonFields = rows.filter(r => uncommonFieldList.every(u => u !== r.fieldName))
    result.push(obj)

    return result.map(r => {
        return Object.assign(r, diy)
    })
}

// 解析地址编码
function parseNumber(text) {
    let obj = {}
    let provinceRows = []
    let cityRows = []
    let zoneRows = []
    let execArray = null

    text.split("\n").forEach(line => {
        if (execArray = /^(\d+)\t(\d+)\t(.+)\t(\d+)\t(.+)\t(\d+)\t(.+)$/.exec(line)) {
            let postalCode = execArray[1]
            let code = execArray[2]
            let name = execArray[3]
            let cityCode = execArray[4]
            let cityName = execArray[5]
            let provinceCode = execArray[6]
            let provinceName = execArray[7]

            let provinceRow = {
                code: provinceCode,
                name: provinceName,
                level: 1,
                provinceCode: provinceCode,
                fullName: provinceName
            }
            if (provinceRows.every(x => x.code != provinceRow.code)) {
                provinceRows.push(provinceRow)
            }

            let cityRow = {
                code: cityCode,
                name: cityName,
                level: 2,
                provinceCode: provinceCode,
                cityCode: cityCode,
                fullName: cityName + ', ' + provinceName,
                parentCode: provinceCode,
                postalCode: postalCode
            }
            if (cityRows.every(x => x.code != cityRow.code)) {
                cityRows.push(cityRow)
            }

            let zoneRow = {
                code: code,
                name: name,
                level: 3,
                provinceCode: provinceCode,
                cityCode: cityCode,
                zoneCode: code,
                fullName: name + ', ' + cityName + ', ' + provinceName,
                parentCode: cityCode,
                postalCode: postalCode
            }
            if (zoneRows.every(x => x.code != zoneRow.code)) {
                zoneRows.push(zoneRow)
            }
        }
    })
    obj.provinceRows = provinceRows
    obj.cityRows = cityRows
    obj.zoneRows = zoneRows

    return obj
}

// 解析 Scala 的 serviceImpl 文件
function parseServiceImpl(text) {
    let obj = {}
    let rows = []
    text.split("\n").forEach(line => {
        let execArray = null
        if (execArray = /^\s*override\s+def\s+(\w+)\((\w+)\s*\:\s*(List\[\w+\]|\w+)\)\s*\:\s*(List\[\w+\]|\w+)/.exec(line)) {
            let row = {
                method: execArray[1],
                param: execArray[2],
                paramType: execArray[3],
                resultType: execArray[4],
                haveParam: true
            }
            row.haveResult = row.resultType != "Unit"
            rows.push(row)
        } else if (execArray = /^\s*override\s+def\s+(\w+)\(\)\s*\:\s*(List\[\w+\]|\w+)/.exec(line)) {
            let row = {
                method: execArray[1],
                param: "",
                paramType: "",
                resultType: execArray[2],
                haveParam: false
            }
            row.haveResult = row.resultType != "Unit"
            rows.push(row)
        } else if (execArray = /^\s*class\s+(\w+)\s+extends\s+(\w+)/.exec(line)) {
            obj.serviceImpl = execArray[1]
            obj.service = execArray[2]
            let name = obj.service.substring(0, obj.service.length - 7)
            obj.name = lowerFirst(name)
        } else if (execArray = /^\s*package\s+([\w\.]+)/.exec(line)) {
            obj.package = execArray[1]
        }
    })
    obj.rows = rows
    return obj
}

// 解析SQL枚举
/**
[
    {
        name: "",
        comment: "",
        rows: [
            {value: 1, eName: "", eComment: ""}
        ]
    }
]

 */
function parseSqlEnum(text) {
    let objs = []
    let tableName = ""
    text.split("\n").forEach(line => {
        let execArray = null
        if (execArray = /\'([\u4E00-\u9FA5\w]+),((\d+\:[\u4E00-\u9FA5\w]+\(\w+\);?)+)\'/.exec(line)) {
            let comment = execArray[1]
            let enums = execArray[2].split(";")
            let rows = enums.filter(e => /(\d+)\:([\u4E00-\u9FA5\w]+)\((\w+)\)/.test(e)).map(function (e) {
                let r = /(\d+)\:([\u4E00-\u9FA5\w]+)\((\w+)\)/.exec(e)
                let row = {
                    value: r[1],
                    eComment: r[2],
                    eName: underScore(r[3]).toUpperCase()
                }
                return row
            })

            let filedName = /^\s*`(\w+)`/.exec(line)[1]
            let name = tableName + upperFirst(camelize(filedName))

            objs.push({ name, comment, rows })
        } else if (execArray = /^CREATE TABLE (?:`\w+`\.)?`(\w+)`/i.exec(line)) {
            // 匹配表名
            tableName = upperFirst(singular(camelize(execArray[1])))
        }
    })
    return objs
}

// 通过模板格式来渲染对象
function transform(textArr, obj, templateArr) {
    for (let i = 0; i < templateArr.length; i++) {
        const templateLine = templateArr[i]
        let execArray = null
        if (execArray = /^\s*=\[IFM,(!)?(\w+)\]\s*/.exec(templateLine)) {
            // 多行 If
            let tempArr = []
            let ifmCount = 1 // 条件语句计数器
            i += 1 // 读取下一行
            while (ifmCount > 0) {
                const tempLine = templateArr[i]
                if (/^\s*=\[IFM,(!)?(\w+)\]\s*/.test(tempLine)) {
                    ifmCount += 1
                } else if (/^\s*=\[IFMEND\]\s*/.test(tempLine)) {
                    ifmCount -= 1
                }

                if (ifmCount > 0) {
                    tempArr.push(tempLine)
                    i += 1
                    if (i > templateArr.length) {
                        break
                    }
                }
            }

            let negation = !!execArray[1] // 有 ！则为 true， 没有 ! 则为 false
            let condition = !!obj[execArray[2]]
            if (negation !== condition) {
                transform(textArr, obj, tempArr)
            }
        } else if (execArray = /^\s*=\[FOR,(\w+)\]\s*/.exec(templateLine)) {
            // For 循环
            let tempArr = [];
            i += 1;
            while (!/^\s*=\[FOREND\]\s*/.test(templateArr[i])) {
                tempArr.push(templateArr[i]);
                i += 1;
                if (i > templateArr.length) {
                    break
                }
            }
            let arr = obj[execArray[1]]
            arr.forEach((v, k) => {
                let value = Object.assign({forIndex: k + 1, forLength: arr.length}, obj, v)
                transform(textArr, value, tempArr)
            })
        } else {
            let el =
                templateLine
                    .replace(/=\[IF,(!)?(\w+)\](.+?)\[IFEND\]/g, (_, negation, field, str) => !!negation !== !!obj[field] ? str : '')
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

// 所有字母转小写
function lowerAll(str) {
    const upperRE = /([A-Z])/g
    return str ? str.replace(upperRE, (_, a) => a.toLowerCase()) : str
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

// 把数据类型转换为Scala的类型，旧的domain转换
// 数据类型: string, int, timestamp, double
// Scala的类型: String, Int, LocalDateTime, BigDecimal
function dataTypeToScalaV1(str) {
    let types = ['string','int','timestamp','double']
    let scalaTypes = ['String','Int','java.sql.Timestamp','BigDecimal']
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

// 给 Scala 关键字加 ``
function scalaKey(str) {
    let scalaKeys = ["type"]
    return scalaKeys.some(k => k == str) ? "`" + str + "`" : str
}

function left(str, length) {
    return str.substring(0, length)
}

function leftReTail(str, length) {
    return str.substring(0, str.length - length)
}

(function () {
    // 模板支持的普通方法
    window.supportMethod = {
        camelize,
        underScore,
        upperFirst,
        lowerFirst,
        lowerAll,
        plural,
        singular,
        upperFirstAndPlural,
        dataTypeToScala,
        dataTypeToThrift,
        addInt,
        minusInt,
        strReTail,
        scalaKey,
        dataTypeToScalaV1,
        left,
        leftReTail
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
        parseThrift,
        parseSqlList,
        parseNumber,
        parseServiceImpl,
        parseSqlEnum
    }
})()