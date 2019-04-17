// ========= 内置模板 ========= 

(function () {

    let thriftDomainTemplate = 
`file:=[singular,tableNameOrigin]_domain.thrift
namespace java com.ipolymer.soa.=[soaName].domain
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
    =[forIndex]:=[IF,isOptional] optional[IFEND] =[dataTypeToThrift,dataType] =[fieldName]
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
namespace java com.ipolymer.soa.=[soaName].service
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
    * 查询所有=[strReTail,tableComment]
    */
    list<=[singular,tableNameOrigin]_domain.T=[upperFirst,tableName]> findAll=[upperFirstAndPlural,tableName]()
    /**
    * 分页查询=[strReTail,tableComment]
    **/
    =[singular,tableNameOrigin]_domain.TFind=[upperFirst,tableName]PageResponse find=[upperFirst,tableName]Page(=[singular,tableNameOrigin]_domain.TFind=[upperFirst,tableName]PageRequest request)
    /**
    * 通过=[plural,primaryKeyName]查询=[strReTail,tableComment]列表
    **/
    list<=[singular,tableNameOrigin]_domain.T=[upperFirst,tableName]> find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName](list<=[dataTypeToThrift,primaryKeyDataType]> =[plural,primaryKeyName])
}
`;

    let caseClassTemplate =
`file:=[upperFirst,tableName].scala
package com.ipolymer.soa.=[soaName].scala.domain

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
package com.ipolymer.soa.=[soaName].scala.service

import com.ipolymer.soa.=[soaName].scala.domain._
import com.ipolymer.soa.=[soaName].scala.action.=[tableName]._
import org.springframework.transaction.annotation.Transactional

@Transactional(value = "=[soaName]", rollbackFor = Array(classOf[Exception]))
class =[upperFirst,tableName]ServiceImpl extends =[upperFirst,tableName]Service {
  override def create=[upperFirst,tableName](request: TCreate=[upperFirst,tableName]Request): Unit = new Create=[upperFirst,tableName]Action(request).execute

  override def update=[upperFirst,tableName](request: TUpdate=[upperFirst,tableName]Request): Unit = new Update=[upperFirst,tableName]Action(request).execute

  override def delete=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]): Unit = new Delete=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action(=[primaryKeyName]).execute

  override def find=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]): T=[upperFirst,tableName] = new Find=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action(=[primaryKeyName]).execute

  override def findAll=[upperFirstAndPlural,tableName](): List[T=[upperFirst,tableName]] = new FindAll=[upperFirstAndPlural,tableName]Action().execute

  override def find=[upperFirst,tableName]Page(request: TFind=[upperFirst,tableName]PageRequest): TFind=[upperFirst,tableName]PageResponse = new Find=[upperFirst,tableName]PageAction(request).execute

  override def find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName](=[plural,primaryKeyName]: List[=[dataTypeToScala,primaryKeyDataType]]): List[T=[upperFirst,tableName]] = new Find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName]Action(=[plural,primaryKeyName]).execute
}
`;

    let dbTemplate = 
`file:=[datasouce].scala
def findAll=[upperFirstAndPlural,tableName](): List[=[upperFirst,tableName]] = {
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
=[FOREND]
def find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName](=[plural,primaryKeyName]: List[=[dataTypeToScala,primaryKeyDataType]]): List[=[upperFirst,tableName]] = {
  datasouce.rows[=[upperFirst,tableName]](sql" SELECT * FROM \`=[tableNameOrigin]\` WHERE \`=[primaryKeyNameOrigin]\` IN " + buildSqlIn(=[plural,primaryKeyName]))
}
`;

    let createActionTemplate = 
`file:Create=[upperFirst,tableName]Action.scala
package com.ipolymer.soa.=[soaName].scala.action.=[tableName]

import com.ipolymer.soa.=[soaName].scala.db.=[datasouce]
import com.ipolymer.soa.=[soaName].scala.db.=[datasouce].datasouce
import com.ipolymer.soa.=[soaName].scala.domain.TCreate=[upperFirst,tableName]Request
import com.ipolymer.soa.=[soaName].scala.helper.BaseHelper
import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.scala_commons.sql._

/**
  * 新增=[strReTail,tableComment]
  */
class Create=[upperFirst,tableName]Action(request: TCreate=[upperFirst,tableName]Request) extends Action[Unit] {
  override def preCheck: Unit = {
=[FOR,commonFields]
=[IFM,isPrimaryKey]
=[IFM,!isAutoIncrement]
    assert(=[datasouce].find=[upperFirst,tableName]By=[upperFirst,fieldName](request.=[fieldName]).isEmpty, "=[fieldComment]已存在")
=[IFMEND]
=[IFMEND]
=[IFM,isUniqueKey]
    assert(=[datasouce].find=[upperFirst,tableName]By=[upperFirst,fieldName](request.=[fieldName]).isEmpty, "=[fieldComment]已存在")
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
=[FOR,commonFields]
          \`=[fieldNameOrigin]\` = \${request.=[scalaKey,fieldName]},
=[FOREND]
          \`created_by\` = \${BaseHelper.operatorId},
          \`updated_by\` = \${BaseHelper.operatorId}
      """
    datasouce.esql(insertSql)
  }
}
`;

let updateActionTemplate = 
`file:Update=[upperFirst,tableName]Action.scala
package com.ipolymer.soa.=[soaName].scala.action.=[tableName]

import com.ipolymer.soa.=[soaName].scala.db.=[datasouce]
import com.ipolymer.soa.=[soaName].scala.domain.TUpdate=[upperFirst,tableName]Request
import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.ipolymer.soa.=[soaName].scala.db.=[datasouce].datasouce
import com.ipolymer.soa.=[soaName].scala.helper.BaseHelper
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._

/**
  * 更新=[strReTail,tableComment]
  */
class Update=[upperFirst,tableName]Action(request: TUpdate=[upperFirst,tableName]Request) extends Action[Unit] {
  private lazy val =[tableName]Opt = =[datasouce].find=[upperFirst,tableName]By=[upperFirst,primaryKeyName](request.=[primaryKeyName])

  override def preCheck: Unit = {
    assert(request.=[primaryKeyName].isNotEmpty, "=[primaryKeyName] 不能为空")
    assert(=[tableName]Opt.isDefined, "=[strReTail,tableComment]不存在")

=[FOR,commonFields]
=[IFM,isUniqueKey]
    if (request.=[fieldName].isDefined) {
      val =[tableName]By=[upperFirst,fieldName]Opt = =[datasouce].find=[upperFirst,tableName]By=[upperFirst,fieldName](request.=[fieldName].get)
      assert(=[tableName]By=[upperFirst,fieldName]Opt.isEmpty || =[tableName]By=[upperFirst,fieldName]Opt.get.=[fieldName] == =[tableName]Opt.get.=[fieldName], "=[fieldComment]已存在")
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
        request.=[scalaKey,fieldName].isDefined.optional(sql" \`=[fieldNameOrigin]\` = \${request.=[scalaKey,fieldName].get}, ") +
=[IFMEND]
=[FOREND]
        sql" \`updated_by\` = \${BaseHelper.operatorId} WHERE \`=[primaryKeyNameOrigin]\` = \${request.=[primaryKeyName]} "
    datasouce.esql(updateSql)
  }
}
`;

let deleteActionTemplate = 
`file:Delete=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action.scala
package com.ipolymer.soa.=[soaName].scala.action.=[tableName]

import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.ipolymer.soa.=[soaName].scala.db.=[datasouce]
import com.ipolymer.soa.=[soaName].scala.db.=[datasouce].datasouce
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._

/**
  * 删除=[strReTail,tableComment]
  */
class Delete=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action(=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]) extends Action[Unit] {

  override def preCheck: Unit = {
    assert(=[primaryKeyName].isNotEmpty, "=[primaryKeyName] 不能为空")
    assert(=[datasouce].exist=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName]), "=[strReTail,tableComment]不存在")
  }

  override def action: Unit = {
    datasouce.esql(sql"DELETE FROM \`=[tableNameOrigin]\` WHERE \`=[primaryKeyNameOrigin]\` = \${=[primaryKeyName]}")
  }
}
`;

let findByKeyActionTemplate = 
`file:Find=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action.scala
package com.ipolymer.soa.=[soaName].scala.action.=[tableName]

import com.ipolymer.soa.=[soaName].scala.db.=[datasouce]
import com.ipolymer.soa.=[soaName].scala.domain.T=[upperFirst,tableName]
import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.scala_commons.sql._

/**
  * 通过=[primaryKeyName]查询=[strReTail,tableComment]
  */
class Find=[upperFirst,tableName]By=[upperFirst,primaryKeyName]Action(=[primaryKeyName]: =[dataTypeToScala,primaryKeyDataType]) extends Action[T=[upperFirst,tableName]] {
  private lazy val =[tableName]Opt = =[datasouce].find=[upperFirst,tableName]By=[upperFirst,primaryKeyName](=[primaryKeyName])

  override def preCheck: Unit = {
    assert(=[primaryKeyName].isNotEmpty, "=[primaryKeyName] 不能为空")
    assert(=[tableName]Opt.isDefined, "=[strReTail,tableComment]不存在")
  }

  override def action: T=[upperFirst,tableName] = {
    BeanBuilder.build[T=[upperFirst,tableName]](=[tableName]Opt.get)()
  }
}
`;

let findAllActionTemplate = 
`file:FindAll=[upperFirstAndPlural,tableName]Action.scala
package com.ipolymer.soa.=[soaName].scala.action.=[tableName]

import com.ipolymer.soa.=[soaName].scala.db.=[datasouce]
import com.ipolymer.soa.=[soaName].scala.domain.T=[upperFirst,tableName]
import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.scala_commons.sql._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._

/**
  * 查询所有=[strReTail,tableComment]
  */
class FindAll=[upperFirstAndPlural,tableName]Action() extends Action[List[T=[upperFirst,tableName]]] {
  override def preCheck: Unit = {}

  override def action: List[T=[upperFirst,tableName]] = {
    =[datasouce].findAll=[upperFirstAndPlural,tableName]().map(it => {
      BeanBuilder.build[T=[upperFirst,tableName]](it)()
    })
  }
}
`;

let findByKeysActionTemplate = 
`file:Find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName]Action.scala
package com.ipolymer.soa.=[soaName].scala.action.=[tableName]

import com.ipolymer.soa.=[soaName].scala.db.=[datasouce]
import com.ipolymer.soa.=[soaName].scala.domain.T=[upperFirst,tableName]
import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.scala_commons.sql._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.commons.converters.Implicits._

/**
  * 通过=[plural,primaryKeyName]查询=[strReTail,tableComment]列表
  */
class Find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName]Action(=[plural,primaryKeyName]: List[=[dataTypeToScala,primaryKeyDataType]]) extends Action[List[T=[upperFirst,tableName]]] {
  override def preCheck: Unit = {}

  override def action: List[T=[upperFirst,tableName]] = {
    =[datasouce].find=[upperFirstAndPlural,tableName]By=[upperFirstAndPlural,primaryKeyName](=[plural,primaryKeyName]).map(it => {
      BeanBuilder.build[T=[upperFirst,tableName]](it)()
    })
  }
}
`;

let findPageActionTemplate = 
`file:Find=[upperFirst,tableName]PageAction.scala
package com.ipolymer.soa.=[soaName].scala.action.=[tableName]

import com.ipolymer.soa.common.scala.util.TPageResponse
import com.ipolymer.soa.=[soaName].scala.db.=[datasouce].datasouce
import com.ipolymer.soa.=[soaName].scala.domain._
import com.isuwang.commons.Action
import com.isuwang.commons.Assert._
import com.isuwang.commons.converters.Implicits._
import com.isuwang.commons.converters.SqlImplicits._
import com.isuwang.scala_commons.sql._

/**
  * 分页查询=[strReTail,tableComment]
  */
class Find=[upperFirst,tableName]PageAction(request: TFind=[upperFirst,tableName]PageRequest) extends Action[TFind=[upperFirst,tableName]PageResponse] {
  override def preCheck: Unit = {}

  override def action: TFind=[upperFirst,tableName]PageResponse = {
    val countSql = sql"SELECT count(*) FROM \`=[tableNameOrigin]\` "
    val count = datasouce.getCount(countSql + whereSql)
    val rows = if (count > 0) getRows else List.empty[T=[upperFirst,tableName]]

    new TFind=[upperFirst,tableName]PageResponse(
      new TPageResponse(request.pageRequest.start, request.pageRequest.limit, count),
      rows
    )
  }

  private lazy val whereSql = sql" WHERE 1=1 " +
=[FOR,commonFields]
    request.=[scalaKey,fieldName].isDefined.optional(sql" AND \`=[fieldNameOrigin]\` = \${request.=[scalaKey,fieldName].get} ") =[SEP,addSeparatorPlus]
=[FOREND]

  private def getRows: List[T=[upperFirst,tableName]] = {
    val selectSql = sql"SELECT * FROM \`=[tableNameOrigin]\` "
    val orderBySql = s" ORDER BY \${request.pageRequest.sortFields.getOrElse("updated_at")} DESC "
    val limitSql = sql" LIMIT \${request.pageRequest.start}, \${request.pageRequest.limit} "
    datasouce.rows[=[upperFirst,tableName]](selectSql + whereSql + orderBySql + limitSql).map(it => BeanBuilder.build[T=[upperFirst,tableName]](it)())
  }
}
`;

let serviceXmlTemplate = 
`file:services.xml
    <bean id="=[tableName]Service" class="com.ipolymer.soa.=[soaName].scala.service.=[upperFirst,tableName]ServiceImpl"/>
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
        findByKeyActionTemplate + 
        findAllActionTemplate + 
        findByKeysActionTemplate +
        findPageActionTemplate;

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
        findAllActionTemplate,
        findPageActionTemplate,
        serviceXmlTemplate,
        bigTemplate
    };
})();

