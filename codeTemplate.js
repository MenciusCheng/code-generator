// ========= 内置模板 ========= 

(function () {

    let thriftTemplate =
`/**
* =[tableComment]
**/
struct T=[upperFirst,tableName] {
=[FOR,rows]
=[IFM,fieldComment]
    /**
    * =[fieldComment]
    **/
=[IFMEND]
    =[forIndex]:=[IF,isOptional] optional[IFEND] =[dataTypeToThrift,dataType] =[fieldName]
=[FOREND]
}`;
    
    let caseClassTemplate =
`import java.time.LocalDateTime
import com.isuwang.scala_commons.sql.ResultSetMapper

case class =[upperFirst,tableName] (
=[FOR,rows]
/** =[fieldComment] */
=[fieldName]: =[IF,isOptional]Option[[IFEND]=[dataTypeToScala,dataType]=[IF,isOptional]][IFEND]=[SEP,addSeparatorComma]
=[FOREND]
)

object =[upperFirst,tableName] {
    implicit val resultSetMapper: ResultSetMapper[=[upperFirst,tableName]] = ResultSetMapper.material[=[upperFirst,tableName]]
}`;
    
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
}`;

    let blankTemplate = "";

    window.supportTemplate = {
        thriftTemplate,
        caseClassTemplate,
        curdSqlTemplate,
        metaUITemplate,
        serviceTemplate,
        blankTemplate
    };
})();

