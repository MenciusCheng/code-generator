
// 解析创建表 SQL 为一个对象
function parseSql(sql) {
    function createRow() {
        return {
            fieldName: "",
            dataType: "",
            isOptional: 0,
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
            obj.tableName = camelize(execArray[1])
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

            row.isOptional = line.indexOf(" NOT NULL") > 0 ? 0 : 1

            let matchComment = /COMMENT \'(.+)\'/i.exec(line)
            row.fieldComment = matchComment ? matchComment[1] : ''

            rows.push(row)
        }
    })

    return obj
}

function camelize(str) {
    const camelizeRE = /_(\w)/g
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
}


function upperFirst(str) {
    return str[0].toUpperCase() + str.slice(1, str.length)
}

function transform(textArr, obj, templateArr) {
    for (let i = 0; i < templateArr.length; i++) {
        const element = templateArr[i];
        let matchFor = /^\s*-\[FOR,(\w+)\]$/.exec(element)
        if (matchFor) {
            // debugger
            let tempArr = [];
            i += 1;
            while (!/^\s*-\[FOREND\]$/.test(templateArr[i])) {
                tempArr.push(templateArr[i]);
                i += 1;
            }
            let arr = obj[matchFor[1]]
            arr.forEach((v, k) => {
                let value = v;
                value.index = k + 1;
                transform(textArr, value, tempArr);
            })
        } else {
            const el =
                element
                    .replace(/=\[(\w+)\]/g, (_, field) => obj[field])
                    .replace(/=\[(\w+),(\w+)\]/g, (_, fn, field) => {
                        if (fn === "UP") {
                            return upperFirst(obj[field]);
                        }
                    });
            textArr.push(el);
        }
    }
}

function start() {
    let cr = [];
    let tp = thriftTemplate.split("\n");
    transformSub(cr, tt, tp);
    console.log(cr.join("\n"));
}

let thriftTemplate =
`/**
* =[tableComment]
**/
struct T=[UP,tableName] {
-[FOR,rows]
    /**
    * =[fieldComment]
    **/
    =[index]: =[dataType] =[fieldName]
-[FOREND]
}
`;

let caseClassTemplate =
`case class =[UP,tableName] ( 
-[FOR,rows]
/** =[fieldComment] */ 
=[fieldName]: =[dataType],
-[FOREND]
) 	
    
object =[UP,tableName] extends SnakifiedSprayJsonSupport{
    implicit val =[tableName]Format = jsonFormat16(=[UP,tableName].apply)
        implicit val resultSetMapper: ResultSetMapper[=[UP,tableName]] = ResultSetMapper.material[=[UP,tableName]]
}
`;

(function () {
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
})();