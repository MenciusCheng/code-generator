// ========= 内置模板 ========= 

(function () {

    let thriftDomainTemplate = 
`file:=[singular,tableNameOrigin]_domain.thrift
namespace java com.isuwang.soa.=[apiPackage].domain
include "base_model.thrift"

/**
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
}

struct TCreate=[upperFirst,tableName]Request {
=[FOR,commonFields]
    /**
    * =[fieldComment]
    **/
    =[forIndex]:=[IF,isNotNeed] optional[IFEND] =[dataTypeToThrift,dataType] =[fieldName]
=[FOREND]
}

struct TUpdate=[upperFirst,tableName]Request {
    1: =[dataTypeToThrift,primaryKeyDataType] =[primaryKeyName]
=[FOR,rows]
=[IFM,isCommonField]
=[IFM,!isPrimaryKey]
    /**
    * =[fieldComment]
    **/
    =[forIndex]: optional =[dataTypeToThrift,dataType] =[fieldName]
=[IFMEND]
=[IFMEND]
=[FOREND]
}

struct TFind=[upperFirst,tableName]PageRequest {
    1: base_model.TPageRequest pageRequest
=[FOR,commonFields]
    /**
    * =[fieldComment]
    **/
    =[addInt,forIndex,1]: optional =[dataTypeToThrift,dataType] =[fieldName]
=[FOREND]
}

struct TFind=[upperFirst,tableName]PageResponse {
    1: base_model.TPageResponse pageResponse
    2: list<T=[upperFirst,tableName]> rows
}
`;

    let thrfitServiceTemplate = 
`file:=[singular,tableNameOrigin]_service.thrift
namespace java com.isuwang.soa.=[apiPackage].service
include "=[singular,tableNameOrigin]_domain.thrift"

/**
* =[strReTail,tableComment]服务
**/
service =[upperFirst,tableName]Service {
    /**
    * 新增=[strReTail,tableComment]
    **/
    void create=[upperFirst,tableName](=[singular,tableNameOrigin]_domain.TCreate=[upperFirst,tableName]Request request)
    /**
    * 更新=[strReTail,tableComment]
    **/
    void update=[upperFirst,tableName](=[singular,tableNameOrigin]_domain.TUpdate=[upperFirst,tableName]Request request)
    /**
    * 删除=[strReTail,tableComment]
    **/
    void delete=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[dataTypeToThrift,primaryKeyDataType] =[primaryKeyName])
    /**
    * 通过=[primaryKeyName]查询=[strReTail,tableComment]
    **/
    =[singular,tableNameOrigin]_domain.T=[upperFirst,tableName] find=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[dataTypeToThrift,primaryKeyDataType] =[primaryKeyName])
    /**
    * 通过=[plural,primaryKeyName]查询=[strReTail,tableComment]列表
    **/
    list<=[singular,tableNameOrigin]_domain.T=[upperFirst,tableName]> find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName](list<=[dataTypeToThrift,primaryKeyDataType]> =[plural,primaryKeyName])
    /**
    * 分页查询=[strReTail,tableComment]
    **/
    =[singular,tableNameOrigin]_domain.TFind=[upperFirst,tableName]PageResponse find=[upperFirst,tableName]Page(=[singular,tableNameOrigin]_domain.TFind=[upperFirst,tableName]PageRequest request)
}
`;

    let caseClassTemplate =
`file:=[upperFirst,tableName].scala
package com.isuwang.soa.=[servicePackage].scala.domain

import java.time.LocalDateTime
import com.isuwang.scala_commons.sql.ResultSetMapper

case class =[upperFirst,tableName] 
(
=[FOR,rows]
/** =[fieldComment] */
=[scalaKey,fieldName]: =[IF,isOptional]Option[[IFEND]=[dataTypeToScala,dataType]=[IF,isOptional]][IFEND]=[SEP,addSeparatorComma]
=[FOREND]
)

object =[upperFirst,tableName] {
    implicit val resultSetMapper: ResultSetMapper[=[upperFirst,tableName]] = ResultSetMapper.material[=[upperFirst,tableName]]
}
`;

    let serviceImplTemplate = 
`file:=[upperFirst,tableName]ServiceImpl.scala
package com.isuwang.soa.=[servicePackage].scala.service

import org.springframework.transaction.annotation.Transactional
import com.isuwang.soa.=[apiPackage].scala.service.=[upperFirst,tableName]Service
import com.isuwang.soa.=[servicePackage].scala.action.=[lowerAll,tableName]._

@Transactional(value = "=[datasource]", rollbackFor = Array(classOf[Exception]))
class =[upperFirst,tableName]ServiceImpl extends =[upperFirst,tableName]Service {

}
`;

    let dbTemplate = 
`file:=[upperFirst,tableName]SQL.scala
def find=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]): Option[=[upperFirst,tableName]] = {
  datasource.row[=[upperFirst,tableName]](sql" SELECT * FROM \`=[tableNameOrigin]\` WHERE \`=[primaryKeyNameOrigin]\` = \${=[primaryKeyName]}")
}

def exist=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]): Boolean = {
  datasource.queryInt(sql" SELECT COUNT(*) FROM \`=[tableNameOrigin]\` WHERE \`=[primaryKeyNameOrigin]\` = \${=[primaryKeyName]}") > 0
}

def find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName](=[plural,primaryKeyName]: List[=[dataTypeToScala,primaryKeyDataType]]): List[=[upperFirst,tableName]] = {
  datasource.rows[=[upperFirst,tableName]](sql" SELECT * FROM \`=[tableNameOrigin]\` WHERE \`=[primaryKeyNameOrigin]\` IN " + buildSqlIn(=[plural,primaryKeyName]))
}
=[FOR,commonFields]
=[IFM,isUniqueKey]

def find=[upperFirst,tableName]By=[upperFirst,fieldName](=[fieldName]: =[dataTypeToScala,dataType]): Option[=[upperFirst,tableName]] = {
  datasource.row[=[upperFirst,tableName]](sql" SELECT * FROM \`=[tableNameOrigin]\` WHERE \`=[fieldNameOrigin]\` = \${=[scalaKey,fieldName]}")
}
=[IFMEND]
=[FOREND]
`;

  let createActionTemplate = 
`file:Create=[upperFirst,tableName]Action.scala
package com.isuwang.soa.=[servicePackage].scala.action.=[lowerAll,tableName]

import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._
import com.isuwang.soa.=[servicePackage].scala.utils.BaseHelper
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL.datasource
import com.isuwang.soa.=[apiPackage].scala.domain.TCreate=[upperFirst,tableName]Request

/**
  * 新增=[strReTail,tableComment]
  */
class Create=[upperFirst,tableName]Action(request: TCreate=[upperFirst,tableName]Request) extends Action[Unit] {
  override def preCheck: Unit = {
=[FOR,commonFields]
=[IFM,isPrimaryKey]
=[IFM,!isAutoIncrement]
    assert(=[upperFirst,tableName]SQL.find=[upperFirst,tableName]By=[upperFirst,fieldName](request.=[fieldName]).isEmpty, "=[fieldName] 已存在")
=[IFMEND]
=[IFMEND]
=[IFM,isUniqueKey]
    if (request.=[fieldName].isDefined) {
      assert(=[upperFirst,tableName]SQL.find=[upperFirst,tableName]By=[upperFirst,fieldName](request.=[fieldName].get).isEmpty, "=[fieldName] 已存在")
    }
=[IFMEND]
=[FOREND]
  }

  override def action: Unit = {
    insert=[upperFirst,tableName](request)
  }

  private def insert=[upperFirst,tableName](request: TCreate=[upperFirst,tableName]Request): Unit = {
    val insertSql =
      sql"""
        INSERT INTO \`=[tableNameOrigin]\` SET
          \`created_by\` = \${BaseHelper.operatorId}
          ,\`updated_by\` = \${BaseHelper.operatorId}
=[FOR,commonFields]
=[IFM,!isNotNeed]
          ,\`=[fieldNameOrigin]\` = \${request.=[scalaKey,fieldName]=[IF,isTimestamp].toLocalDateTime[IFEND]}
=[IFMEND]
=[FOREND]
        """ +
=[FOR,commonFields]
=[IFM,isNotNeed]
        request.=[scalaKey,fieldName].isDefined.optional(sql" ,\`=[fieldNameOrigin]\` = \${request.=[scalaKey,fieldName].get=[IF,isTimestamp].toLocalDateTime[IFEND]} ") =[SEP,addSeparatorPlus]
=[IFMEND]
=[FOREND]

    datasource.esql(insertSql)
  }
}
`;

let updateActionTemplate = 
`file:Update=[upperFirst,tableName]Action.scala
package com.isuwang.soa.=[servicePackage].scala.action.=[lowerAll,tableName]

import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._
import com.isuwang.soa.=[servicePackage].scala.utils.BaseHelper
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL.datasource
import com.isuwang.soa.=[apiPackage].scala.domain.TUpdate=[upperFirst,tableName]Request

/**
  * 更新=[strReTail,tableComment]
  */
class Update=[upperFirst,tableName]Action(request: TUpdate=[upperFirst,tableName]Request) extends Action[Unit] {
  private lazy val =[tableName]Opt = =[upperFirst,tableName]SQL.find=[upperFirst,tableName]By=[upperFirst,primaryKeyName](request.=[primaryKeyName])

  override def preCheck: Unit = {
    assert(request.=[primaryKeyName].isNotEmpty, "=[primaryKeyName] 为空")
    assert(=[tableName]Opt.isDefined, "=[tableName] 不存在")
=[FOR,commonFields]
=[IFM,isUniqueKey]

    if (request.=[fieldName].isDefined) {
      val =[tableName]By=[upperFirst,fieldName]Opt = =[upperFirst,tableName]SQL.find=[upperFirst,tableName]By=[upperFirst,fieldName](request.=[fieldName].get)
      assert(=[tableName]By=[upperFirst,fieldName]Opt.isEmpty || =[tableName]By=[upperFirst,fieldName]Opt.get.=[primaryKeyName] == =[tableName]Opt.get.=[primaryKeyName], "=[fieldName] 已存在")
    }
=[IFMEND]
=[FOREND]
  }

  override def action: Unit = {
    update=[upperFirst,tableName](request)
  }

  private def update=[upperFirst,tableName](request: TUpdate=[upperFirst,tableName]Request): Unit = {
    val updateSql =
      sql" UPDATE \`=[tableNameOrigin]\` SET " +
=[FOR,commonFields]
=[IFM,!isPrimaryKey]
        request.=[scalaKey,fieldName].isDefined.optional(sql" \`=[fieldNameOrigin]\` = \${request.=[scalaKey,fieldName].get=[IF,isTimestamp].toLocalDateTime[IFEND]}, ") +
=[IFMEND]
=[FOREND]
        sql" \`updated_by\` = \${BaseHelper.operatorId} WHERE \`=[primaryKeyNameOrigin]\` = \${request.=[primaryKeyName]} "
    datasource.esql(updateSql)
  }
}
`;

let deleteActionTemplate = 
`file:Delete=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action.scala
package com.isuwang.soa.=[servicePackage].scala.action.=[lowerAll,tableName]

import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL.datasource

/**
  * 删除=[strReTail,tableComment]
  */
class Delete=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action(=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]) extends Action[Unit] {
  override def preCheck: Unit = {
    assert(=[primaryKeyName].isNotEmpty, "=[primaryKeyName] 为空")
    assert(=[upperFirst,tableName]SQL.exist=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName]), "=[tableName] 不存在")
  }

  override def action: Unit = {
    val deleteSql = sql"UPDATE \`=[tableNameOrigin]\` SET \`is_deleted\` = 1 WHERE \`=[primaryKeyNameOrigin]\` = \${=[primaryKeyName]}"
    datasource.esql(deleteSql)
  }
}
`;

let findByKeyActionTemplate = 
`file:Find=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action.scala
package com.isuwang.soa.=[servicePackage].scala.action.=[lowerAll,tableName]

import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL
import com.isuwang.soa.=[apiPackage].scala.domain.T=[upperFirst,tableName]

/**
  * 通过=[primaryKeyName]查询=[strReTail,tableComment]
  */
class Find=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action(=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]) extends Action[T=[upperFirst,tableName]] {
  private lazy val =[plural,tableName] = new Find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName]Action(List(=[primaryKeyName])).execute

  override def preCheck: Unit = {
    assert(=[primaryKeyName].isNotEmpty, "=[primaryKeyName] 为空")
    assert(=[plural,tableName].nonEmpty, "=[tableName] 不存在")
  }

  override def action: T=[upperFirst,tableName] = {
    =[plural,tableName].head
  }
}
`;

let findByKeysActionTemplate = 
`file:Find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName]Action.scala
package com.isuwang.soa.=[servicePackage].scala.action.=[lowerAll,tableName]

import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL
import com.isuwang.soa.=[apiPackage].scala.domain.T=[upperFirst,tableName]

/**
  * 通过=[plural,primaryKeyName]查询=[strReTail,tableComment]列表
  */
class Find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName]Action(=[plural,primaryKeyName]: List[=[dataTypeToScala,primaryKeyDataType]]) extends Action[List[T=[upperFirst,tableName]]] {
  override def preCheck: Unit = {}

  override def action: List[T=[upperFirst,tableName]] = {
    =[upperFirst,tableName]SQL.find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName](=[plural,primaryKeyName]).map(it => {
      BeanBuilder.build[T=[upperFirst,tableName]](it)()
    })
  }
}
`;

let findByKeyActionTemplate2 = 
`file:Find=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action.scala
package com.isuwang.soa.=[servicePackage].scala.action.=[lowerAll,tableName]

import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL
import com.isuwang.soa.=[apiPackage].scala.domain.T=[upperFirst,tableName]

/**
  * 通过=[primaryKeyName]查询=[strReTail,tableComment]
  */
class Find=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action(=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]) extends Action[T=[upperFirst,tableName]] {
  private lazy val =[tableName]Opt = =[upperFirst,tableName]SQL.find=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName])

  override def preCheck: Unit = {
    assert(=[primaryKeyName].isNotEmpty, "=[primaryKeyName] 为空")
    assert(=[tableName]Opt.isDefined, "=[tableName] 不存在")
  }

  override def action: T=[upperFirst,tableName] = {
    BeanBuilder.build[T=[upperFirst,tableName]](=[tableName]Opt.get)()
  }
}
`;

let findOneActionTemplate = 
`file:FindOne=[upperFirst,tableName]Action.scala
package com.isuwang.soa.=[servicePackage].scala.action.=[lowerAll,tableName]

import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL.datasource
import com.isuwang.soa.=[apiPackage].scala.domain.{TFindOne=[upperFirst,tableName]Request, T=[upperFirst,tableName]}

/**
  * 查询一个=[strReTail,tableComment]
  */
class FindOne=[upperFirst,tableName]Action(request: TFindOne=[upperFirst,tableName]Request) extends Action[T=[upperFirst,tableName]] {
  override def preCheck: Unit = {
    assert(=[tableName]Opt.isDefined, "=[tableName] 不存在")
  }

  override def action: T=[upperFirst,tableName] = {
    BeanBuilder.build[T=[upperFirst,tableName]](=[tableName]Opt.get)()
  }

  private lazy val =[tableName]Opt = datasource.row[=[upperFirst,tableName]](sql" SELECT * FROM \`=[tableNameOrigin]\` " + whereSql)

  private lazy val whereSql = sql" WHERE 1 = 1 " +
    request.=[primaryKeyName].isDefined.optional(sql" AND \`=[primaryKeyName]\` = \${request.=[primaryKeyName].get} ") +
=[FOR,commonFields]
=[IFM,isUniqueKey]
    request.=[scalaKey,fieldName].isDefined.optional(sql" AND \`=[fieldNameOrigin]\` = \${request.=[scalaKey,fieldName].get} ") =[SEP,addSeparatorPlus]
=[IFMEND]
=[FOREND]
}
`;

let findPageActionTemplate = 
`file:Find=[upperFirst,tableName]PageAction.scala
package com.isuwang.soa.=[servicePackage].scala.action.=[lowerAll,tableName]

import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._
import com.isuwang.soa.common.scala.util.TPageResponse
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL
import com.isuwang.soa.=[servicePackage].scala.db.=[upperFirst,tableName]SQL.datasource
import com.isuwang.soa.=[apiPackage].scala.domain._

/**
  * 分页查询=[strReTail,tableComment]
  */
class Find=[upperFirst,tableName]PageAction(request: TFind=[upperFirst,tableName]PageRequest) extends Action[TFind=[upperFirst,tableName]PageResponse] {
  override def preCheck: Unit = {}

  override def action: TFind=[upperFirst,tableName]PageResponse = {
    val countSql = sql"SELECT count(*) FROM \`=[tableNameOrigin]\` "
    val count = datasource.getCount(countSql + whereSql)
    val rows = if (count > 0) getRows else List.empty[T=[upperFirst,tableName]]

    new TFind=[upperFirst,tableName]PageResponse(
      new TPageResponse(request.pageRequest.start, request.pageRequest.limit, count),
      rows
    )
  }

  private lazy val whereSql = sql" WHERE 1 = 1 " +
=[FOR,commonFields]
    request.=[scalaKey,fieldName].isDefined.optional(sql" AND \`=[fieldNameOrigin]\` = \${request.=[scalaKey,fieldName].get} ") =[SEP,addSeparatorPlus]
=[FOREND]

  private def getRows: List[T=[upperFirst,tableName]] = {
    val selectSql = sql"SELECT * FROM \`=[tableNameOrigin]\` "
    val orderBySql = s" ORDER BY \${request.pageRequest.sortFields.getOrElse("updated_at DESC")} "
    val limitSql = sql" LIMIT \${request.pageRequest.start}, \${request.pageRequest.limit} "
    datasource.rows[=[upperFirst,tableName]](selectSql + whereSql + orderBySql + limitSql).map(it => BeanBuilder.build[T=[upperFirst,tableName]](it)())
  }
}
`;

let serviceXmlTemplate = 
`file:services.xml
    <bean id="=[tableName]Service" class="com.isuwang.soa.=[servicePackage].scala.service.=[upperFirst,tableName]ServiceImpl"/>
    <soa:service ref="=[tableName]Service"/>
`;

    let bigTemplate = thriftDomainTemplate + 
        thrfitServiceTemplate + 
        caseClassTemplate + 
        serviceImplTemplate + 
        dbTemplate + 
        createActionTemplate + 
        updateActionTemplate + 
        deleteActionTemplate + 
        findByKeysActionTemplate +
        findByKeyActionTemplate + 
        findByKeyActionTemplate2 +
        findOneActionTemplate +
        findPageActionTemplate +
        serviceXmlTemplate;

    window.supportTemplate = {
        thriftDomainTemplate,
        thrfitServiceTemplate,
        caseClassTemplate,
        serviceImplTemplate,
        dbTemplate,
        createActionTemplate,
        updateActionTemplate,
        deleteActionTemplate,
        findByKeyActionTemplate,
        findPageActionTemplate,
        serviceXmlTemplate,
        bigTemplate
    };
})();

