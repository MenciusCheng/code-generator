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
  datasource.rows[=[upperFirst,tableName]](sql" SELECT * FROM \`=[tableNameOrigin]\`")
}

def find=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]): Option[=[upperFirst,tableName]] = {
  datasource.row[=[upperFirst,tableName]](sql" SELECT * FROM \`=[tableNameOrigin]\` WHERE \`=[primaryKeyNameOrigin]\` = \${=[primaryKeyName]}")
}

def exist=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]): Boolean = {
  datasource.queryInt(sql" SELECT COUNT(*) FROM \`=[tableNameOrigin]\` WHERE \`=[primaryKeyNameOrigin]\` = \${=[primaryKeyName]}") > 0
}

=[FOR,commonFields]
=[IFM,isUniqueKey]
def find=[upperFirst,tableName]By=[upperFirst,fieldName](=[fieldName]: String): Option[=[upperFirst,tableName]] = {
  datasource.row[=[upperFirst,tableName]](sql" SELECT * FROM \`=[tableNameOrigin]\` WHERE \`=[fieldNameOrigin]\` = \${=[scalaKey,fieldName]}")
}

=[IFMEND]
=[FOREND]`;

    let serviceXmlTemplate = 
`    <bean id="=[tableName]Service" class="com.ipolymer.soa.productdb.scala.service.=[upperFirst,tableName]ServiceImpl"/>
    <soa:service ref="=[tableName]Service"/>
`;

    let domainTableTemplate =
`import wangzx.scala_commons.sql.Table

@Table(value = "=[tableNameOrigin]", camelToUnderscore = true)
class =[upperFirst,tableName] extends java.io.Serializable {
=[FOR,rows]
=[IFM,fieldComment]
  /** =[fieldComment] */
=[IFMEND]
  var =[scalaKey,fieldName]: =[dataTypeToScalaV1,dataType] = _
=[FOREND]
}
`;

    let serviceImplTemplate =
`
=[FOR,rows]
  override def =[method](=[IF,haveParam]=[param]: =[paramType][IFEND]): =[resultType] = new =[upperFirst,method]Action(=[param]).execute

=[FOREND]
=[FOR,rows]

=[upperFirst,method]Action.scala
--------------------------------

package =[leftReTail,package,7]action.=[name]

import com.ipolymer.order.sql.OrderSql.datasource
import com.ipolymer.soa.order.scala.domain._
import com.ipolymer.soa.order.scala.helper.BaseHelper
import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._

class =[upperFirst,method]Action(=[IF,haveParam]=[param]: =[paramType][IFEND]) extends Action[=[resultType]] {
  override def preCheck: Unit = {}

  override def action: =[resultType] = {
=[IFM,haveResult]
    null
=[IFMEND]
  }
}
=[FOREND]
`;

    let sqlEnumTemplate =
`/**
* =[comment]
**/
enum =[name] {
=[FOR,rows]
   /**
   * =[eComment]
   **/
   =[eName] = =[value]
=[FOREND]
}
`;

    let thAreaTemplate =
`INSERT INTO \`iplm_productdb\`.\`th_area\`(\`code\`, \`name\`, \`level\`, \`province_code\`, \`city_code\`, \`zone_code\`, \`full_name\`, \`parent_code\`, \`postal_code\`) 
VALUES 
=[FOR,provinceRows]
('=[code]', '=[name]', =[level], '=[provinceCode]', NULL, NULL, '=[fullName]', NULL, ''),
=[FOREND]
=[FOR,cityRows]
('=[code]', '=[name]', =[level], '=[provinceCode]', '=[cityCode]', NULL, '=[fullName]', '=[parentCode]', '=[postalCode]'),
=[FOREND]
=[FOR,zoneRows]
('=[code]', '=[name]', =[level], '=[provinceCode]', '=[cityCode]', '=[zoneCode]', '=[fullName]', '=[parentCode]', '=[postalCode]')=[SEP,addSeparatorComma]
=[FOREND]
;
`;

    let blankTemplate = "";

    window.supportTemplate = {
        thriftTemplate,
        caseClassTemplate,
        dbTemplate,
        serviceXmlTemplate,
        metaUITemplate,
        blankTemplate,
        domainTableTemplate,
        serviceImplTemplate,
        sqlEnumTemplate,
        thAreaTemplate
    };
})();

