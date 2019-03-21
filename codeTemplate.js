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
=[scalaKey,fieldName]: =[IF,isOptional]Option[[IFEND]=[dataTypeToScala,dataType]=[IF,isOptional]][IFEND]=[SEP,addSeparatorComma]
=[FOREND]
)

object =[upperFirst,tableName] {
    implicit val resultSetMapper: ResultSetMapper[=[upperFirst,tableName]] = ResultSetMapper.material[=[upperFirst,tableName]]
}`;
    
    let metaUITemplate = 
`INSERT INTO \`metadb\`.\`fields\`(\`id\`, \`domain\`, \`entity\`, \`struct_name\`, \`name\`, \`element\`, \`label\`, \`required\`, \`multi\`, \`format\`, \`editable\`, \`validate\`, \`length\`, \`max_length\`, \`min_length\`, \`regexp\`, \`prompt\`, \`min\`, \`max\`, \`candidates\`, \`candidate_label\`, \`candidate_value\`, \`placeholder\`, \`src_key\`, \`visible\`, \`created_at\`, \`created_by\`, \`updated_at\`, \`updated_by\`, \`disabled\`) 
VALUES
=[FOR,rows]
(62=[forIndex], 'crm', 'T=[upperFirst,tableName]', 'com.isuwang.soa.crm.company.domain.T=[upperFirst,tableName]', '=[fieldName]', NULL, '=[fieldComment]', 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NOW(), NULL, NOW(), NULL, NULL)=[SEP,addSeparatorComma]
=[FOREND]
;
`;

    let dbTemplate = 
`def findAll=[upperFirstAndPlural,tableName](): List[=[upperFirst,tableName]] = {
  datasouce.rows[=[upperFirst,tableName]](sql" SELECT * FROM \`=[tableNameOrigin]\`")
}

def find=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]): Option[=[upperFirst,tableName]] = {
  datasouce.row[=[upperFirst,tableName]](sql" SELECT * FROM \`=[tableNameOrigin]\` WHERE \`=[primaryKeyNameOrigin]\` = \${=[primaryKeyName]}")
}

def exist=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]): Boolean = {
  datasouce.queryInt(sql" SELECT COUNT(*) FROM \`=[tableNameOrigin]\` WHERE \`=[primaryKeyNameOrigin]\` = \${=[primaryKeyName]}") > 0
}

=[FOR,commonFields]
=[IFM,isUniqueKey]
def find=[upperFirst,tableName]By=[upperFirst,fieldName](=[fieldName]: String): Option[=[upperFirst,tableName]] = {
  datasouce.row[=[upperFirst,tableName]](sql" SELECT * FROM \`=[tableNameOrigin]\` WHERE \`=[fieldNameOrigin]\` = \${=[scalaKey,fieldName]}")
}

=[IFMEND]
=[FOREND]`;

    let serviceXmlTemplate = 
`    <bean id="=[tableName]Service" class="com.ipolymer.soa.productdb.scala.service.=[upperFirst,tableName]ServiceImpl"/>
    <soa:service ref="=[tableName]Service"/>
`;

    let blankTemplate = "";

    window.supportTemplate = {
        thriftTemplate,
        caseClassTemplate,
        dbTemplate,
        serviceXmlTemplate,
        metaUITemplate,
        blankTemplate
    };
})();

