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
        } else if (execArray = /^@=\[([\w|_]+),(.+)\]$/.exec(line)) {
            obj[execArray[1]] = execArray[2]
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

// 把数据类型转换为Scala的类型
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
    =[forIndex]:=[IF,isOptional] optional[IFEND] =[dataTypeToThrift,dataType] =[fieldName]
=[FOREND]
}
`;

let caseClassTemplate =
`case class =[upperFirst,tableName] ( 
=[FOR,rows]
/** =[fieldComment] */ 
=[fieldName]: =[IF,isOptional]Option[[IFEND]=[dataTypeToScala,dataType]=[IF,isOptional]][IFEND]=[SEP,addSeparatorComma]
=[FOREND]
) 	
    
object =[upperFirst,tableName] extends SnakifiedSprayJsonSupport{
    implicit val =[tableName]Format = jsonFormat16(=[upperFirst,tableName].apply)
        implicit val resultSetMapper: ResultSetMapper[=[upperFirst,tableName]] = ResultSetMapper.material[=[upperFirst,tableName]]
}
`;

let curdSqlTemplate = 
`  def insert=[upperFirst,tableName](request: TCreate=[upperFirst,tableName]Request) {
    val insertSql = 
      sql"""
        INSERT INTO =[plural,tableName] SET
  =[FOR,rows]
          =[underScore,fieldName] = \${request.=[fieldName]}=[SEP,addSeparatorComma]
  =[FOREND]
      """
    datasouce.esql(insertSql)
  }
  
  def updateCategory(request: TUpdateCategoryRequest) {
    val updateSql = 
      sql" UPDATE =[plural,tableName] SET " +
=[FOR,rows]
      (request.=[fieldName].isDefined).optional(sql"=[underScore,fieldName] = \${request.=[fieldName].get()},") +
=[FOREND]
      sql" updated_at = NOW() WHERE id = \${request.id} "
    datasouce.esql(insertSql)
  }
  
  def get=[upperFirst,tableName]ById(id: Int): Option[=[upperFirst,tableName]] = {
    datasouce.row[=[upperFirst,tableName]](sql" SELECT * FROM =[plural,tableName] WHERE id = \${id}")
  }
  
  def getAll=[upperFirst,tableName](): List[=[upperFirst,tableName]] = {
    datasouce.rows[=[upperFirst,tableName]](sql"SELECT * FROM =[plural,tableName] ")
  }
`;

let metaUITemplate = 
`INSERT INTO \`metadb\`.\`fields\`(\`id\`, \`domain\`, \`entity\`, \`struct_name\`, \`name\`, \`element\`, \`label\`, \`required\`, \`multi\`, \`format\`, \`editable\`, \`validate\`, \`length\`, \`max_length\`, \`min_length\`, \`regexp\`, \`prompt\`, \`min\`, \`max\`, \`candidates\`, \`candidate_label\`, \`candidate_value\`, \`placeholder\`, \`src_key\`, \`visible\`, \`created_at\`, \`created_by\`, \`updated_at\`, \`updated_by\`, \`disabled\`) 
VALUES
=[FOR,rows]
(62=[forIndex], 'crm', 'T=[upperFirst,tableName]', 'com.isuwang.soa.crm.company.domain.T=[upperFirstAndPlural,tableName]', '=[fieldName]', NULL, '=[fieldComment]', 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NOW(), NULL, NOW(), NULL, NULL)=[SEP,addSeparatorComma]
=[FOREND]
;
`;

let serviceTemplate = 
`namespace java com.ipolymer.soa.productdb.service
include "=[tableName]_domain.thrift"

/**
* =[serviceName]服务
**/
service =[upperFirst,tableName]Service {
    /**
    * 新增=[serviceName]
    **/
    void create=[upperFirst,tableName](=[tableName]_domain.TCreate=[upperFirst,tableName]Request request)
    /**
    * 更新=[serviceName]
    **/
    void update=[upperFirst,tableName](=[tableName]_domain.TUpdate=[upperFirst,tableName]Request request)
    /**
    * 删除=[serviceName]
    **/
    void delete=[upperFirst,tableName]ById(i32 id)
    /**
    * 通过id获取=[serviceName]
    **/
    =[tableName]_domain.T=[upperFirst,tableName] find=[upperFirst,tableName]ById(i32 id)
    /**
    * 查询所有=[serviceName]
    */
    list<=[tableName]_domain.T=[upperFirst,tableName]> findAll=[upperFirstAndPlural,tableName]()
    /**
    * 分页查询=[serviceName]
    **/
    =[tableName]_domain.TFind=[upperFirst,tableName]PageResponse find=[upperFirst,tableName]Page(=[tableName]_domain.TFind=[upperFirst,tableName]PageRequest request)
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
        dataTypeToScala,
        dataTypeToThrift,
        upperFirstAndPlural
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
        } else if (event.target.value == "CURD") {
            $('#templateTextArea').val(curdSqlTemplate)
        } else if (event.target.value == "metaUI") {
            $('#templateTextArea').val(metaUITemplate)
        } else if (event.target.value == "service") {
            $('#templateTextArea').val(serviceTemplate)
        } else if (event.target.value == "自定义") {
            $('#templateTextArea').val("")
        }
    })

    $('#templateTextArea').val(thriftTemplate)

    new ClipboardJS('#copyResultButton');
})();