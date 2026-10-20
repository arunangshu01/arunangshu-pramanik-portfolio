import {
  SiPython,
  SiJavascript,
  SiTypescript,
  SiPostgresql,
  SiSnowflake,
  SiDatabricks,
  SiGooglebigquery,
  SiGooglecloud,
  SiPandas,
  SiNumpy,
  SiApacheairflow,
  SiFastapi,
  SiDjango,
  SiSpringboot,
  SiOpenapiinitiative,
  SiDocker,
  SiKubernetes,
  SiJenkins,
  SiGit,
  SiGithub,
  SiGithubactions,
  SiBitbucket,
  SiGnubash,
  SiYaml,
  SiDatadog,
  SiElasticsearch,
  SiKibana,
  SiApachekafka,
  SiRedis,
  SiJira,
  SiConfluence,
  SiDbeaver,
  SiPostman,
  SiPycharm,
  SiIntellijidea,
  SiEclipseide,
  SiCursor,
  SiHtml5,
  SiCss,
  SiBootstrap,
  SiAngular,
  SiReact,
} from "react-icons/si";
import { DiMsqlServer, DiJava } from "react-icons/di";
import { FaSlack, FaDatabase } from "react-icons/fa";
import {
  TbBrandAzure,
  TbBrandTeams,
  TbBrandVisualStudio,
  TbApi,
  TbRobot,
  TbFileTypeSql,
  TbCode,
  TbFileCode,
} from "react-icons/tb";

const FALLBACK = TbCode;
const azure = TbBrandAzure;
const gcp = SiGooglecloud;

const MAP = {
  // programming languages
  Python: SiPython,
  SQL: TbFileTypeSql,
  Java: DiJava,
  JavaScript: SiJavascript,
  TypeScript: SiTypescript,

  // databases & data warehouses
  "Microsoft SQL Server": DiMsqlServer,
  Oracle: FaDatabase,
  PostgreSQL: SiPostgresql,
  Snowflake: SiSnowflake,
  Databricks: SiDatabricks,
  BigQuery: SiGooglebigquery,

  // data analysis
  Pandas: SiPandas,
  NumPy: SiNumpy,
  PySpark: TbFileCode,

  // frameworks
  FastAPI: SiFastapi,
  Django: SiDjango,
  "Spring Boot": SiSpringboot,
  "RESTful APIs": SiOpenapiinitiative,

  // cloud platforms
  Azure: azure,
  GCP: gcp,

  // orchestrator
  "Apache Airflow": SiApacheairflow,

  // azure resources
  "Azure Event Hubs": azure,
  "Azure Files": azure,
  "Azure Blob Storage": azure,
  "Azure Storage Explorer": azure,
  "Azure Container Registry": azure,
  "Azure Container Services": azure,
  "Azure Key Vault": azure,

  // gcp resources
  "Cloud Tasks": gcp,
  "Cloud Run": gcp,
  "Cloud Run Functions": gcp,
  "Cloud SQL": gcp,
  "Cloud Scheduler": gcp,
  Workflows: gcp,
  Eventarc: gcp,
  "Cloud Storage": gcp,
  "Secret Manager": gcp,
  "Pub/Sub": gcp,
  Dataflow: gcp,
  "Compute Engine": gcp,
  "Analytics Hub": gcp,
  IAM: gcp,
  VPC: gcp,
  "Cloud Networking": gcp,
  "Google Cloud APIs": gcp,
  "Databricks Workspace": SiDatabricks,

  // devops
  Docker: SiDocker,
  Kubernetes: SiKubernetes,
  Jenkins: SiJenkins,
  Git: SiGit,
  GitHub: SiGithub,
  "GitHub Actions": SiGithubactions,
  Bitbucket: SiBitbucket,
  "Bitbucket Pipelines": SiBitbucket,
  "Shell Scripting": SiGnubash,
  YAML: SiYaml,

  // monitoring & logging
  Datadog: SiDatadog,
  Elasticsearch: SiElasticsearch,
  Kibana: SiKibana,

  // messaging & caching
  Kafka: SiApachekafka,
  Redis: SiRedis,

  // collaboration & project management
  Jira: SiJira,
  Confluence: SiConfluence,
  Slack: FaSlack,
  "Microsoft Teams": TbBrandTeams,

  // database & api tools
  DBeaver: SiDbeaver,
  "Offset Explorer": TbApi,
  Postman: SiPostman,

  // ides & editors
  "Visual Studio Code": TbBrandVisualStudio,
  PyCharm: SiPycharm,
  "IntelliJ IDEA Community Edition": SiIntellijidea,
  "Eclipse IDE": SiEclipseide,
  "Python IDLE": SiPython,

  // ai tools
  Cursor: SiCursor,
  "Devin AI": TbRobot,

  // web technologies
  HTML: SiHtml5,
  CSS: SiCss,
  Bootstrap: SiBootstrap,
  Angular: SiAngular,
  React: SiReact,
};

export const skillIcon = (name) => MAP[name] ?? FALLBACK;
