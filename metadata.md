<?xml version="1.0" encoding="utf-8"?>

<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" xmlns="http://docs.oasis-open.org/odata/ns/edm">
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_COMMUNICATION',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="com.sap.vocabularies.Communication.v1" Alias="Communication"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_PERSONALDATA',Version='0001',SAP**Origin='LOCAL')/$value">
        <edmx:Include Namespace="com.sap.vocabularies.PersonalData.v1" Alias="PersonalData"/>
    </edmx:Reference>
    <edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_ANALYTICS',Version='0001',SAP__Origin='LOCAL')/$value">
<edmx:Include Namespace="com.sap.vocabularies.Analytics.v1" Alias="Analytics"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_COMMON',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="com.sap.vocabularies.Common.v1" Alias="SAP**common"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_MEASURES',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="Org.OData.Measures.V1" Alias="SAP**measures"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_CORE',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="Org.OData.Core.V1" Alias="SAP**core"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_CAPABILITIES',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="Org.OData.Capabilities.V1" Alias="SAP**capabilities"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_AGGREGATION',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="Org.OData.Aggregation.V1" Alias="SAP**aggregation"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_VALIDATION',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="Org.OData.Validation.V1" Alias="SAP**validation"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_CODELIST',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="com.sap.vocabularies.CodeList.v1" Alias="SAP**CodeList"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_UI',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="com.sap.vocabularies.UI.v1" Alias="SAP**UI"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_HTML5',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="com.sap.vocabularies.HTML5.v1" Alias="SAP**HTML5"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_PDF',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="com.sap.vocabularies.PDF.v1" Alias="SAP**PDF"/>
</edmx:Reference>
<edmx:Reference Uri="/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Vocabularies(TechnicalName='%2FIWBEP%2FVOC_SESSION',Version='0001',SAP**Origin='LOCAL')/$value">
<edmx:Include Namespace="com.sap.vocabularies.Session.v1" Alias="SAP**session"/>
</edmx:Reference>
<edmx:DataServices>
<Schema Namespace="com.sap.gateway.srvd.z17_sd_notification.v0001" Alias="SAP__self">
<Annotation Term="SAP__core.SchemaVersion" String="1.0.0"/>
<EntityType Name="RecipientType">
<Key>
<PropertyRef Name="NotificationId"/>
<PropertyRef Name="UserId"/>
</Key>
<Property Name="NotificationId" Type="Edm.Guid" Nullable="false"/>
<Property Name="UserId" Type="Edm.String" Nullable="false" MaxLength="12"/>
<Property Name="IsRead" Type="Edm.Boolean" Nullable="false"/>
<Property Name="ReadAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="IsArchived" Type="Edm.Boolean" Nullable="false"/>
<Property Name="ArchivedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="IsDeleted" Type="Edm.Boolean" Nullable="false"/>
<Property Name="DeletedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="CreatedBy" Type="Edm.String" Nullable="false" MaxLength="12"/>
<Property Name="CreatedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="LocalLastChangedBy" Type="Edm.String" Nullable="false" MaxLength="12"/>
<Property Name="LocalLastChangedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<NavigationProperty Name="_Notification" Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false" Partner="_Recipients">
<ReferentialConstraint Property="NotificationId" ReferencedProperty="NotificationId"/>
</NavigationProperty>
</EntityType>
<EntityType Name="ActionType">
<Key>
<PropertyRef Name="NotificationId"/>
<PropertyRef Name="ActionSeq"/>
</Key>
<Property Name="NotificationId" Type="Edm.Guid" Nullable="false"/>
<Property Name="ActionSeq" Type="Edm.Byte" Nullable="false"/>
<Property Name="ActionLabel" Type="Edm.String" Nullable="false" MaxLength="50"/>
<Property Name="SematicObject" Type="Edm.String" Nullable="false" MaxLength="100"/>
<Property Name="SematicAction" Type="Edm.String" Nullable="false" MaxLength="50"/>
<Property Name="Params" Type="Edm.String" Nullable="false" MaxLength="255"/>
<Property Name="CreatedBy" Type="Edm.String" Nullable="false" MaxLength="12"/>
<Property Name="CreatedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="LocalLastChangedBy" Type="Edm.String" Nullable="false" MaxLength="12"/>
<Property Name="LocalLastChangedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<NavigationProperty Name="_Notification" Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false" Partner="_Actions">
<ReferentialConstraint Property="NotificationId" ReferencedProperty="NotificationId"/>
</NavigationProperty>
</EntityType>
<EntityType Name="SettingType">
<Key>
<PropertyRef Name="CategoryCode"/>
</Key>
<Property Name="CategoryCode" Type="Edm.String" Nullable="false" MaxLength="30"/>
<Property Name="Obligatory" Type="Edm.Boolean" Nullable="false"/>
<Property Name="IsEnabled" Type="Edm.Boolean" Nullable="false"/>
<Property Name="EmailEnabled" Type="Edm.Boolean" Nullable="false"/>
<Property Name="CreatedBy" Type="Edm.String" Nullable="false" MaxLength="12"/>
<Property Name="CreatedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="LocalLastChangedBy" Type="Edm.String" Nullable="false" MaxLength="12"/>
<Property Name="LocalLastChangedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="LastChangedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="__EntityControl" Type="com.sap.gateway.srvd.z17_sd_notification.v0001.EntityControl"/>
<Property Name="SAP__Messages" Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.SAP__Message)" Nullable="false"/>
</EntityType>
<EntityType Name="CategoryValueHelpType">
<Key>
<PropertyRef Name="CategoryCode"/>
</Key>
<Property Name="CategoryCode" Type="Edm.String" Nullable="false" MaxLength="30"/>
<Property Name="CategoryName" Type="Edm.String" Nullable="false" MaxLength="100"/>
<Property Name="CategoryDesc" Type="Edm.String" Nullable="false" MaxLength="255"/>
</EntityType>
<EntityType Name="NotificationType">
<Key>
<PropertyRef Name="NotificationId"/>
</Key>
<Property Name="NotificationId" Type="Edm.Guid" Nullable="false"/>
<Property Name="CategoryCode" Type="Edm.String" Nullable="false" MaxLength="30"/>
<Property Name="EventCode" Type="Edm.String" Nullable="false" MaxLength="30"/>
<Property Name="Priority" Type="Edm.Byte" Nullable="false"/>
<Property Name="Title" Type="Edm.String" Nullable="false" MaxLength="120"/>
<Property Name="Body" Type="Edm.String" Nullable="false" MaxLength="5000"/>
<Property Name="SourceType" Type="Edm.String" Nullable="false" MaxLength="20"/>
<Property Name="SourceName" Type="Edm.String" Nullable="false" MaxLength="100"/>
<Property Name="ObjectKey" Type="Edm.String" Nullable="false" MaxLength="100"/>
<Property Name="ScheduledAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="ExpiresAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="SentAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="Status" Type="Edm.String" Nullable="false" MaxLength="10"/>
<Property Name="CreatedBy" Type="Edm.String" Nullable="false" MaxLength="12"/>
<Property Name="CreatedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="LocalLastChangedBy" Type="Edm.String" Nullable="false" MaxLength="12"/>
<Property Name="LocalLastChangedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="LastChangedAt" Type="Edm.DateTimeOffset" Precision="7"/>
<Property Name="__CreateByAssociationControl" Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationCbAControl"/>
<Property Name="__OperationControl" Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationOperationControl"/>
<Property Name="SAP__Messages" Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.SAP__Message)" Nullable="false"/>
<NavigationProperty Name="_Actions" Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.ActionType)" Partner="_Notification">
<OnDelete Action="Cascade"/>
</NavigationProperty>
<NavigationProperty Name="_Recipients" Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.RecipientType)" Partner="_Notification">
<OnDelete Action="Cascade"/>
</NavigationProperty>
</EntityType>
<ComplexType Name="NotificationCbAControl">
<Property Name="_Actions" Type="Edm.Boolean" Nullable="false"/>
<Property Name="_Recipients" Type="Edm.Boolean" Nullable="false"/>
</ComplexType>
<ComplexType Name="NotificationOperationControl">
<Property Name="Archive" Type="Edm.Boolean" Nullable="false"/>
<Property Name="MarkAsDeleted" Type="Edm.Boolean" Nullable="false"/>
<Property Name="MarkAsRead" Type="Edm.Boolean" Nullable="false"/>
<Property Name="MarkAsUnread" Type="Edm.Boolean" Nullable="false"/>
<Property Name="Unarchive" Type="Edm.Boolean" Nullable="false"/>
</ComplexType>
<ComplexType Name="Z17_A_USER_RECEIVE">
<Property Name="UserId" Type="Edm.String" Nullable="false" MaxLength="12"/>
</ComplexType>
<ComplexType Name="Z17_A_ACTION_CREATE">
<Property Name="Sequence" Type="Edm.Byte" Nullable="false"/>
<Property Name="ActionLabel" Type="Edm.String" Nullable="false" MaxLength="50"/>
<Property Name="SematicObject" Type="Edm.String" Nullable="false" MaxLength="100"/>
<Property Name="SematicAction" Type="Edm.String" Nullable="false" MaxLength="50"/>
<Property Name="Params" Type="Edm.String" Nullable="false" MaxLength="255"/>
</ComplexType>
<ComplexType Name="Z17_A_ROLE_RECEIVE">
<Property Name="RoleId" Type="Edm.String" Nullable="false" MaxLength="50"/>
</ComplexType>
<ComplexType Name="Z17_A_TEMPLATE_USE">
<Property Name="Languague" Type="Edm.String" Nullable="false" MaxLength="2"/>
<Property Name="Version" Type="Edm.Int32" Nullable="false"/>
<Property Name="Params" Type="Edm.String" Nullable="false" MaxLength="255"/>
</ComplexType>
<ComplexType Name="EntityControl">
<Property Name="Deletable" Type="Edm.Boolean" Nullable="false"/>
<Property Name="Updatable" Type="Edm.Boolean" Nullable="false"/>
</ComplexType>
<ComplexType Name="SAP__Message">
<Property Name="code" Type="Edm.String" Nullable="false"/>
<Property Name="message" Type="Edm.String" Nullable="false"/>
<Property Name="target" Type="Edm.String"/>
<Property Name="additionalTargets" Type="Collection(Edm.String)" Nullable="false"/>
<Property Name="transition" Type="Edm.Boolean" Nullable="false"/>
<Property Name="numericSeverity" Type="Edm.Byte" Nullable="false"/>
<Property Name="longtextUrl" Type="Edm.String"/>
</ComplexType>
<Action Name="MarkAllAsRead" EntitySetPath="_it" IsBound="true">
<Parameter Name="_it" Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType)" Nullable="false"/>
<ReturnType Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType)" Nullable="true"/>
</Action>
<Action Name="Unarchive" EntitySetPath="_it" IsBound="true">
<Parameter Name="_it" Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false"/>
<ReturnType Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false"/>
</Action>
<Action Name="MarkAsDeleted" EntitySetPath="_it" IsBound="true">
<Parameter Name="_it" Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false"/>
<ReturnType Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false"/>
</Action>
<Action Name="MarkAsUnread" EntitySetPath="_it" IsBound="true">
<Parameter Name="_it" Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false"/>
<ReturnType Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false"/>
</Action>
<Action Name="MarkAsRead" EntitySetPath="_it" IsBound="true">
<Parameter Name="_it" Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false"/>
<ReturnType Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false"/>
</Action>
<Action Name="MarkAllAsDeleted" EntitySetPath="_it" IsBound="true">
<Parameter Name="_it" Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType)" Nullable="false"/>
<ReturnType Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType)" Nullable="true"/>
</Action>
<Action Name="Archive" EntitySetPath="_it" IsBound="true">
<Parameter Name="_it" Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false"/>
<ReturnType Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false"/>
</Action>
<Action Name="CustomCreate" EntitySetPath="_it" IsBound="true">
<Parameter Name="_it" Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType)" Nullable="false"/>
<Parameter Name="CategoryCode" Type="Edm.String" Nullable="false" MaxLength="30"/>
<Parameter Name="EventCode" Type="Edm.String" Nullable="false" MaxLength="30"/>
<Parameter Name="UsingTemplate" Type="Edm.Boolean" Nullable="false"/>
<Parameter Name="Title" Type="Edm.String" Nullable="false" MaxLength="120"/>
<Parameter Name="Body" Type="Edm.String" Nullable="false" MaxLength="5000"/>
<Parameter Name="Priority" Type="Edm.Byte" Nullable="false"/>
<Parameter Name="SourceType" Type="Edm.String" Nullable="false" MaxLength="20"/>
<Parameter Name="SourceName" Type="Edm.String" Nullable="false" MaxLength="100"/>
<Parameter Name="ObjectKey" Type="Edm.String" Nullable="false" MaxLength="100"/>
<Parameter Name="scheduledAt" Type="Edm.DateTimeOffset" Nullable="true" Precision="7"/>
<Parameter Name="_Action" Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.Z17_A_ACTION_CREATE)" Nullable="false"/>
<Parameter Name="_RoleReceivers" Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.Z17_A_ROLE_RECEIVE)" Nullable="false"/>
<Parameter Name="_Template" Type="com.sap.gateway.srvd.z17_sd_notification.v0001.Z17_A_TEMPLATE_USE" Nullable="false"/>
<Parameter Name="_UserReceivers" Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.Z17_A_USER_RECEIVE)" Nullable="false"/>
<ReturnType Type="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType" Nullable="false"/>
</Action>
<Action Name="MarkAllAsUnread" EntitySetPath="_it" IsBound="true">
<Parameter Name="_it" Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType)" Nullable="false"/>
<ReturnType Type="Collection(com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType)" Nullable="true"/>
</Action>
<EntityContainer Name="Container">
<EntitySet Name="Action" EntityType="com.sap.gateway.srvd.z17_sd_notification.v0001.ActionType">
<NavigationPropertyBinding Path="_Notification" Target="Notification"/>
</EntitySet>
<EntitySet Name="CategoryValueHelp" EntityType="com.sap.gateway.srvd.z17_sd_notification.v0001.CategoryValueHelpType"/>
<EntitySet Name="Notification" EntityType="com.sap.gateway.srvd.z17_sd_notification.v0001.NotificationType">
<NavigationPropertyBinding Path="_Actions" Target="Action"/>
<NavigationPropertyBinding Path="_Recipients" Target="Recipient"/>
</EntitySet>
<EntitySet Name="Recipient" EntityType="com.sap.gateway.srvd.z17_sd_notification.v0001.RecipientType">
<NavigationPropertyBinding Path="_Notification" Target="Notification"/>
</EntitySet>
<EntitySet Name="Setting" EntityType="com.sap.gateway.srvd.z17_sd_notification.v0001.SettingType"/>
</EntityContainer>
<Annotations Target="SAP__self.RecipientType/NotificationId">
<Annotation Term="SAP__core.Computed"/>
<Annotation Term="SAP__common.Label" String="UUID"/>
<Annotation Term="SAP__common.QuickInfo" String="16 Byte UUID in 16 Bytes (Raw Format)"/>
</Annotations>
<Annotations Target="SAP__self.RecipientType/UserId">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="User Name"/>
<Annotation Term="SAP__common.Heading" String="User"/>
</Annotations>
<Annotations Target="SAP__self.RecipientType/IsRead">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Truth Value"/>
<Annotation Term="SAP__common.QuickInfo" String="Truth Value: True/False"/>
</Annotations>
<Annotations Target="SAP__self.RecipientType/IsArchived">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Truth Value"/>
<Annotation Term="SAP__common.QuickInfo" String="Truth Value: True/False"/>
</Annotations>
<Annotations Target="SAP__self.RecipientType/IsDeleted">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Truth Value"/>
<Annotation Term="SAP__common.QuickInfo" String="Truth Value: True/False"/>
</Annotations>
<Annotations Target="SAP__self.RecipientType/CreatedBy">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Created By"/>
<Annotation Term="SAP__common.QuickInfo" String="Created By User"/>
</Annotations>
<Annotations Target="SAP__self.RecipientType/LocalLastChangedBy">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Changed By"/>
<Annotation Term="SAP__common.QuickInfo" String="Local Instance Last Changed By User"/>
</Annotations>
<Annotations Target="SAP__self.Container/Recipient">
<Annotation Term="SAP__capabilities.NavigationRestrictions">
<Record>
<PropertyValue Property="RestrictedProperties">
<Collection>
<Record>
<PropertyValue Property="NavigationProperty" NavigationPropertyPath="_Notification"/>
<PropertyValue Property="InsertRestrictions">
<Record>
<PropertyValue Property="Insertable" Bool="false"/>
</Record>
</PropertyValue>
</Record>
</Collection>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.SearchRestrictions">
<Record>
<PropertyValue Property="Searchable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.InsertRestrictions">
<Record>
<PropertyValue Property="Insertable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.DeleteRestrictions">
<Record>
<PropertyValue Property="Deletable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.UpdateRestrictions">
<Record>
<PropertyValue Property="Updatable" Bool="false"/>
<PropertyValue Property="QueryOptions">
<Record>
<PropertyValue Property="SelectSupported" Bool="true"/>
</Record>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP__core.OptimisticConcurrency">
<Collection/>
</Annotation>
<Annotation Term="SAP__capabilities.FilterRestrictions">
<Record>
<PropertyValue Property="FilterExpressionRestrictions">
<Collection>
<Record>
<PropertyValue Property="Property" PropertyPath="UserId"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
<Record>
<PropertyValue Property="Property" PropertyPath="IsRead"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
<Record>
<PropertyValue Property="Property" PropertyPath="IsArchived"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
<Record>
<PropertyValue Property="Property" PropertyPath="IsDeleted"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
<Record>
<PropertyValue Property="Property" PropertyPath="CreatedBy"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
<Record>
<PropertyValue Property="Property" PropertyPath="LocalLastChangedBy"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
</Collection>
</PropertyValue>
</Record>
</Annotation>
</Annotations>
<Annotations Target="SAP__self.RecipientType">
<Annotation Term="SAP__common.Label" String="Recipient Consumption View"/>
</Annotations>
<Annotations Target="SAP__self.ActionType/NotificationId">
<Annotation Term="SAP__core.Computed"/>
<Annotation Term="SAP__common.Label" String="UUID"/>
<Annotation Term="SAP__common.QuickInfo" String="16 Byte UUID in 16 Bytes (Raw Format)"/>
</Annotations>
<Annotations Target="SAP__self.ActionType/SematicObject">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Character 100"/>
</Annotations>
<Annotations Target="SAP__self.ActionType/Params">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Char255"/>
</Annotations>
<Annotations Target="SAP__self.ActionType/CreatedBy">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Created By"/>
<Annotation Term="SAP__common.QuickInfo" String="Created By User"/>
</Annotations>
<Annotations Target="SAP__self.ActionType/LocalLastChangedBy">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Changed By"/>
<Annotation Term="SAP__common.QuickInfo" String="Local Instance Last Changed By User"/>
</Annotations>
<Annotations Target="SAP__self.Container/Action">
<Annotation Term="SAP__capabilities.NavigationRestrictions">
<Record>
<PropertyValue Property="RestrictedProperties">
<Collection>
<Record>
<PropertyValue Property="NavigationProperty" NavigationPropertyPath="_Notification"/>
<PropertyValue Property="InsertRestrictions">
<Record>
<PropertyValue Property="Insertable" Bool="false"/>
</Record>
</PropertyValue>
</Record>
</Collection>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.SearchRestrictions">
<Record>
<PropertyValue Property="Searchable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.InsertRestrictions">
<Record>
<PropertyValue Property="Insertable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.DeleteRestrictions">
<Record>
<PropertyValue Property="Deletable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.UpdateRestrictions">
<Record>
<PropertyValue Property="Updatable" Bool="false"/>
<PropertyValue Property="QueryOptions">
<Record>
<PropertyValue Property="SelectSupported" Bool="true"/>
</Record>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP__core.OptimisticConcurrency">
<Collection/>
</Annotation>
<Annotation Term="SAP__capabilities.FilterRestrictions">
<Record>
<PropertyValue Property="FilterExpressionRestrictions">
<Collection>
<Record>
<PropertyValue Property="Property" PropertyPath="SematicObject"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
<Record>
<PropertyValue Property="Property" PropertyPath="Params"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
<Record>
<PropertyValue Property="Property" PropertyPath="CreatedBy"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
<Record>
<PropertyValue Property="Property" PropertyPath="LocalLastChangedBy"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
</Collection>
</PropertyValue>
</Record>
</Annotation>
</Annotations>
<Annotations Target="SAP__self.ActionType">
<Annotation Term="SAP__common.Label" String="Action Consumption View"/>
</Annotations>
<Annotations Target="SAP__self.SettingType/CategoryCode">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Category Code"/>
<Annotation Term="SAP__common.QuickInfo" String="Unique identifier for notification category"/>
</Annotations>
<Annotations Target="SAP__self.SettingType/Obligatory">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Enabled"/>
<Annotation Term="SAP__common.Heading" String="Enabled Indicator"/>
<Annotation Term="SAP__common.QuickInfo" String="Feature enabled indicator"/>
</Annotations>
<Annotations Target="SAP__self.SettingType/IsEnabled">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Enabled"/>
<Annotation Term="SAP__common.Heading" String="Enabled Indicator"/>
<Annotation Term="SAP__common.QuickInfo" String="Feature enabled indicator"/>
</Annotations>
<Annotations Target="SAP__self.SettingType/EmailEnabled">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Enabled"/>
<Annotation Term="SAP__common.Heading" String="Enabled Indicator"/>
<Annotation Term="SAP__common.QuickInfo" String="Feature enabled indicator"/>
</Annotations>
<Annotations Target="SAP__self.SettingType/CreatedBy">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Created By"/>
<Annotation Term="SAP__common.QuickInfo" String="Created By User"/>
</Annotations>
<Annotations Target="SAP__self.SettingType/LocalLastChangedBy">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Changed By"/>
<Annotation Term="SAP__common.QuickInfo" String="Local Instance Last Changed By User"/>
</Annotations>
<Annotations Target="SAP__self.SettingType/__EntityControl">
<Annotation Term="SAP__core.Computed"/>
<Annotation Term="SAP__UI.HiddenFilter"/>
<Annotation Term="SAP__UI.Hidden"/>
</Annotations>
<Annotations Target="SAP__self.SettingType">
<Annotation Term="SAP__common.Label" String="Setting Consumption View"/>
<Annotation Term="SAP__common.Messages" Path="SAP__Messages"/>
</Annotations>
<Annotations Target="SAP__self.Container/Setting">
<Annotation Term="SAP__capabilities.SearchRestrictions">
<Record>
<PropertyValue Property="Searchable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.FilterRestrictions">
<Record>
<PropertyValue Property="NonFilterableProperties">
<Collection>
<PropertyPath>**EntityControl</PropertyPath>
</Collection>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP**capabilities.SortRestrictions">
<Record>
<PropertyValue Property="NonSortableProperties">
<Collection>
<PropertyPath>**EntityControl</PropertyPath>
</Collection>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP**capabilities.DeleteRestrictions">
<Record>
<PropertyValue Property="Deletable" Path="__EntityControl/Deletable"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.UpdateRestrictions">
<Record>
<PropertyValue Property="Updatable" Path="__EntityControl/Updatable"/>
<PropertyValue Property="QueryOptions">
<Record>
<PropertyValue Property="SelectSupported" Bool="true"/>
</Record>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP__core.OptimisticConcurrency">
<Collection/>
</Annotation>
</Annotations>
<Annotations Target="SAP__self.CategoryValueHelpType/CategoryCode">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Category Code"/>
<Annotation Term="SAP__common.QuickInfo" String="Unique identifier for notification category"/>
</Annotations>
<Annotations Target="SAP__self.CategoryValueHelpType/CategoryName">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Category Name"/>
<Annotation Term="SAP__common.QuickInfo" String="Display name of notification category"/>
</Annotations>
<Annotations Target="SAP__self.CategoryValueHelpType/CategoryDesc">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Category Desc."/>
<Annotation Term="SAP__common.Heading" String="Category Description"/>
<Annotation Term="SAP__common.QuickInfo" String="Detailed description of category purpose"/>
</Annotations>
<Annotations Target="SAP__self.CategoryValueHelpType">
<Annotation Term="SAP__common.Label" String="Value Help for Cateogry"/>
</Annotations>
<Annotations Target="SAP__self.Container/CategoryValueHelp">
<Annotation Term="SAP__capabilities.SearchRestrictions">
<Record>
<PropertyValue Property="Searchable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.InsertRestrictions">
<Record>
<PropertyValue Property="Insertable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.DeleteRestrictions">
<Record>
<PropertyValue Property="Deletable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.UpdateRestrictions">
<Record>
<PropertyValue Property="Updatable" Bool="false"/>
<PropertyValue Property="QueryOptions">
<Record>
<PropertyValue Property="SelectSupported" Bool="true"/>
</Record>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP__core.OptimisticConcurrency">
<Collection/>
</Annotation>
<Annotation Term="SAP__capabilities.FilterRestrictions">
<Record>
<PropertyValue Property="FilterExpressionRestrictions">
<Collection>
<Record>
<PropertyValue Property="Property" PropertyPath="CategoryCode"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
<Record>
<PropertyValue Property="Property" PropertyPath="CategoryName"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
<Record>
<PropertyValue Property="Property" PropertyPath="CategoryDesc"/>
<PropertyValue Property="AllowedExpressions" String="MultiValue"/>
</Record>
</Collection>
</PropertyValue>
</Record>
</Annotation>
</Annotations>
<Annotations Target="SAP__self.NotificationType/NotificationId">
<Annotation Term="SAP__core.Computed"/>
<Annotation Term="SAP__common.Label" String="UUID"/>
<Annotation Term="SAP__common.QuickInfo" String="16 Byte UUID in 16 Bytes (Raw Format)"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/CategoryCode">
<Annotation Term="SAP__common.FieldControl" EnumMember="SAP__common.FieldControlType/Mandatory"/>
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Category Code"/>
<Annotation Term="SAP__common.QuickInfo" String="Unique identifier for notification category"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/EventCode">
<Annotation Term="SAP__common.FieldControl" EnumMember="SAP__common.FieldControlType/Mandatory"/>
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Event Code"/>
<Annotation Term="SAP__common.QuickInfo" String="Unique identifier for business event"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/Title">
<Annotation Term="SAP__common.FieldControl" EnumMember="SAP__common.FieldControlType/Mandatory"/>
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Notification Title"/>
<Annotation Term="SAP__common.QuickInfo" String="Rendered notification title text"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/Body">
<Annotation Term="SAP__common.FieldControl" EnumMember="SAP__common.FieldControlType/Mandatory"/>
<Annotation Term="SAP__common.Label" String="Notification Body"/>
<Annotation Term="SAP__common.QuickInfo" String="Rendered notification body content"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/SourceType">
<Annotation Term="SAP__common.FieldControl" EnumMember="SAP__common.FieldControlType/Mandatory"/>
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Source Type"/>
<Annotation Term="SAP__common.Heading" String="Event Source Type"/>
<Annotation Term="SAP__common.QuickInfo" String="Origin system type"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/SourceName">
<Annotation Term="SAP__common.FieldControl" EnumMember="SAP__common.FieldControlType/Mandatory"/>
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Source Object Name"/>
<Annotation Term="SAP__common.QuickInfo" String="Name of triggering source object"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/ObjectKey">
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Object Key"/>
<Annotation Term="SAP__common.Heading" String="Business Object Key"/>
<Annotation Term="SAP__common.QuickInfo" String="Source Object Key"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/Status">
<Annotation Term="SAP__common.FieldControl" EnumMember="SAP__common.FieldControlType/Mandatory"/>
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Notification Status"/>
<Annotation Term="SAP__common.QuickInfo" String="Current processing status of notification"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/CreatedBy">
<Annotation Term="SAP__core.Computed"/>
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Created By"/>
<Annotation Term="SAP__common.QuickInfo" String="Created By User"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/CreatedAt">
<Annotation Term="SAP__core.Computed"/>
<Annotation Term="SAP__common.Label" String="Created On"/>
<Annotation Term="SAP__common.QuickInfo" String="Creation Date Time"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/LocalLastChangedBy">
<Annotation Term="SAP__core.Computed"/>
<Annotation Term="SAP__common.IsUpperCase"/>
<Annotation Term="SAP__common.Label" String="Changed By"/>
<Annotation Term="SAP__common.QuickInfo" String="Local Instance Last Changed By User"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/LocalLastChangedAt">
<Annotation Term="SAP__core.Computed"/>
<Annotation Term="SAP__common.Label" String="Changed On"/>
<Annotation Term="SAP__common.QuickInfo" String="Local Instance Last Change Date Time"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/LastChangedAt">
<Annotation Term="SAP__core.Computed"/>
<Annotation Term="SAP__common.Label" String="Changed On"/>
<Annotation Term="SAP__common.QuickInfo" String="Last Change Date Time"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/__CreateByAssociationControl">
<Annotation Term="SAP__core.Computed"/>
<Annotation Term="SAP__UI.HiddenFilter"/>
<Annotation Term="SAP__UI.Hidden"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/__OperationControl">
<Annotation Term="SAP__core.Computed"/>
<Annotation Term="SAP__UI.HiddenFilter"/>
<Annotation Term="SAP__UI.Hidden"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/_Actions">
<Annotation Term="SAP__common.Composition"/>
</Annotations>
<Annotations Target="SAP__self.Container/Notification">
<Annotation Term="SAP__capabilities.NavigationRestrictions">
<Record>
<PropertyValue Property="RestrictedProperties">
<Collection>
<Record>
<PropertyValue Property="NavigationProperty" NavigationPropertyPath="_Actions"/>
<PropertyValue Property="InsertRestrictions">
<Record>
<PropertyValue Property="Insertable" Path="__CreateByAssociationControl/_Actions"/>
</Record>
</PropertyValue>
</Record>
<Record>
<PropertyValue Property="NavigationProperty" NavigationPropertyPath="_Recipients"/>
<PropertyValue Property="InsertRestrictions">
<Record>
<PropertyValue Property="Insertable" Path="__CreateByAssociationControl/_Recipients"/>
</Record>
</PropertyValue>
</Record>
</Collection>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.SearchRestrictions">
<Record>
<PropertyValue Property="Searchable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.FilterRestrictions">
<Record>
<PropertyValue Property="Filterable" Bool="true"/>
<PropertyValue Property="FilterExpressionRestrictions">
<Collection>
<Record>
<PropertyValue Property="Property" PropertyPath="Body"/>
<PropertyValue Property="AllowedExpressions" String="SearchExpression"/>
</Record>
</Collection>
</PropertyValue>
<PropertyValue Property="NonFilterableProperties">
<Collection>
<PropertyPath>**CreateByAssociationControl</PropertyPath>
<PropertyPath>**OperationControl</PropertyPath>
</Collection>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.SortRestrictions">
<Record>
<PropertyValue Property="NonSortableProperties">
<Collection>
<PropertyPath>Body</PropertyPath>
<PropertyPath>**CreateByAssociationControl</PropertyPath>
<PropertyPath>**OperationControl</PropertyPath>
</Collection>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.InsertRestrictions">
<Record>
<PropertyValue Property="Insertable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.DeleteRestrictions">
<Record>
<PropertyValue Property="Deletable" Bool="false"/>
</Record>
</Annotation>
<Annotation Term="SAP__capabilities.UpdateRestrictions">
<Record>
<PropertyValue Property="Updatable" Bool="false"/>
<PropertyValue Property="QueryOptions">
<Record>
<PropertyValue Property="SelectSupported" Bool="true"/>
</Record>
</PropertyValue>
</Record>
</Annotation>
<Annotation Term="SAP__core.OptimisticConcurrency">
<Collection/>
</Annotation>
</Annotations>
<Annotations Target="SAP__self.NotificationType/_Recipients">
<Annotation Term="SAP__common.Composition"/>
</Annotations>
<Annotations Target="SAP__self.Unarchive(SAP__self.NotificationType)">
<Annotation Term="SAP__core.OperationAvailable" Path="_it/__OperationControl/Unarchive"/>
</Annotations>
<Annotations Target="SAP__self.MarkAsDeleted(SAP__self.NotificationType)">
<Annotation Term="SAP__core.OperationAvailable" Path="_it/__OperationControl/MarkAsDeleted"/>
</Annotations>
<Annotations Target="SAP__self.MarkAsUnread(SAP__self.NotificationType)">
<Annotation Term="SAP__core.OperationAvailable" Path="_it/__OperationControl/MarkAsUnread"/>
</Annotations>
<Annotations Target="SAP__self.MarkAsRead(SAP__self.NotificationType)">
<Annotation Term="SAP__core.OperationAvailable" Path="_it/__OperationControl/MarkAsRead"/>
</Annotations>
<Annotations Target="SAP__self.Archive(SAP__self.NotificationType)">
<Annotation Term="SAP__core.OperationAvailable" Path="_it/__OperationControl/Archive"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType">
<Annotation Term="SAP__common.Label" String="Notification Consumption View"/>
<Annotation Term="SAP__common.Messages" Path="SAP__Messages"/>
</Annotations>
<Annotations Target="SAP__self.Container">
<Annotation Term="SAP__aggregation.ApplySupported">
<Record>
<PropertyValue Property="Transformations">
<Collection>
<String>aggregate</String>
<String>groupby</String>
<String>filter</String>
</Collection>
</PropertyValue>
<PropertyValue Property="Rollup" EnumMember="SAP__aggregation.RollupType/None"/>
</Record>
</Annotation>
<Annotation Term="SAP__common.ApplyMultiUnitBehaviorForSortingAndFiltering" Bool="true"/>
<Annotation Term="SAP__capabilities.FilterFunctions">
<Collection>
<String>eq</String>
<String>ne</String>
<String>gt</String>
<String>ge</String>
<String>lt</String>
<String>le</String>
<String>and</String>
<String>or</String>
<String>contains</String>
<String>startswith</String>
<String>endswith</String>
<String>any</String>
<String>all</String>
</Collection>
</Annotation>
<Annotation Term="SAP__capabilities.SupportedFormats">
<Collection>
<String>application/json</String>
<String>application/pdf</String>
</Collection>
</Annotation>
<Annotation Term="SAP__PDF.Features">
<Record>
<PropertyValue Property="DocumentDescriptionReference" String="../../../../default/iwbep/common/0001/$metadata"/>
<PropertyValue Property="DocumentDescriptionCollection" String="MyDocumentDescriptions"/>
<PropertyValue Property="ArchiveFormat" Bool="true"/>
<PropertyValue Property="Border" Bool="true"/>
<PropertyValue Property="CoverPage" Bool="true"/>
<PropertyValue Property="FitToPage" Bool="true"/>
<PropertyValue Property="FontName" Bool="true"/>
<PropertyValue Property="FontSize" Bool="true"/>
<PropertyValue Property="Margin" Bool="true"/>
<PropertyValue Property="Signature" Bool="true"/>
<PropertyValue Property="ResultSizeDefault" Int="20000"/>
<PropertyValue Property="ResultSizeMaximum" Int="20000"/>
</Record>
</Annotation>
</Annotations>
<Annotations Target="SAP__self.RecipientType/ReadAt">
<Annotation Term="SAP__common.Label" String="UTCL"/>
<Annotation Term="SAP__common.QuickInfo" String="Time Stamp"/>
</Annotations>
<Annotations Target="SAP__self.RecipientType/ArchivedAt">
<Annotation Term="SAP__common.Label" String="UTCL"/>
<Annotation Term="SAP__common.QuickInfo" String="Time Stamp"/>
</Annotations>
<Annotations Target="SAP__self.RecipientType/DeletedAt">
<Annotation Term="SAP__common.Label" String="UTCL"/>
<Annotation Term="SAP__common.QuickInfo" String="Time Stamp"/>
</Annotations>
<Annotations Target="SAP__self.RecipientType/CreatedAt">
<Annotation Term="SAP__common.Label" String="Created On"/>
<Annotation Term="SAP__common.QuickInfo" String="Creation Date Time"/>
</Annotations>
<Annotations Target="SAP__self.RecipientType/LocalLastChangedAt">
<Annotation Term="SAP__common.Label" String="Changed On"/>
<Annotation Term="SAP__common.QuickInfo" String="Local Instance Last Change Date Time"/>
</Annotations>
<Annotations Target="SAP__self.ActionType/ActionSeq">
<Annotation Term="SAP__common.Label" String="INT1"/>
<Annotation Term="SAP__common.QuickInfo" String="1 Byte Unsigned Integer"/>
</Annotations>
<Annotations Target="SAP__self.ActionType/ActionLabel">
<Annotation Term="SAP__common.Label" String="c"/>
<Annotation Term="SAP__common.QuickInfo" String="Comment"/>
</Annotations>
<Annotations Target="SAP__self.ActionType/SematicAction">
<Annotation Term="SAP__common.Label" String="c"/>
<Annotation Term="SAP__common.QuickInfo" String="Comment"/>
</Annotations>
<Annotations Target="SAP__self.ActionType/CreatedAt">
<Annotation Term="SAP__common.Label" String="Created On"/>
<Annotation Term="SAP__common.QuickInfo" String="Creation Date Time"/>
</Annotations>
<Annotations Target="SAP__self.ActionType/LocalLastChangedAt">
<Annotation Term="SAP__common.Label" String="Changed On"/>
<Annotation Term="SAP__common.QuickInfo" String="Local Instance Last Change Date Time"/>
</Annotations>
<Annotations Target="SAP__self.SettingType/CreatedAt">
<Annotation Term="SAP__common.Label" String="Created On"/>
<Annotation Term="SAP__common.QuickInfo" String="Creation Date Time"/>
</Annotations>
<Annotations Target="SAP__self.SettingType/LocalLastChangedAt">
<Annotation Term="SAP__common.Label" String="Changed On"/>
<Annotation Term="SAP__common.QuickInfo" String="Local Instance Last Change Date Time"/>
</Annotations>
<Annotations Target="SAP__self.SettingType/LastChangedAt">
<Annotation Term="SAP__common.Label" String="Changed On"/>
<Annotation Term="SAP__common.QuickInfo" String="Last Change Date Time"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/Priority">
<Annotation Term="SAP__common.Label" String="Priority"/>
<Annotation Term="SAP__common.Heading" String="Notification Priority"/>
<Annotation Term="SAP__common.QuickInfo" String="Priority level"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/ScheduledAt">
<Annotation Term="SAP__common.Label" String="Scheduled At"/>
<Annotation Term="SAP__common.QuickInfo" String="Scheduled send time"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/ExpiresAt">
<Annotation Term="SAP__common.Label" String="Expires At"/>
<Annotation Term="SAP__common.QuickInfo" String="Auto-archive after this time"/>
</Annotations>
<Annotations Target="SAP__self.NotificationType/SentAt">
<Annotation Term="SAP__common.Label" String="Sent At"/>
<Annotation Term="SAP__common.QuickInfo" String="Notification Sent Time"/>
</Annotations>
</Schema>
</edmx:DataServices>
</edmx:Edmx>
