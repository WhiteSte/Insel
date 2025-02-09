// my-dicom-app/backend/models.js
const { Sequelize, DataTypes } = require("sequelize");

const {
  DB_HOST ,
  DB_USER,
  DB_PASS,
  DB_NAME,
} = process.env;
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: "mysql",
});

// 2) Define Models

// ------------------ PatientTable ------------------
const PatientTable = sequelize.define(
    'PatientTable',
    {
        idPatient: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        BirthDate:{
          type: DataTypes.STRING,

        },
        Name: {
            type: DataTypes.STRING,
        }
    },
    {
        tableName: 'PatientTable', // Force the table name if you want exact naming
        timestamps: true, // disable automatic createdAt/updatedAt
    }
);

// ------------------ StudiesTable ------------------
const StudiesTable = sequelize.define(
    'StudiesTable',
    {
        idStudy: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        idPatient: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        StudyName: {
            type: DataTypes.STRING,
        }
    },
    {
        tableName: 'StudiesTable',
        timestamps: true,
    }
);

// ------------------ ModalityTable ------------------
const ModalityTable = sequelize.define(
    'ModalityTable',
    {
        idModality: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        Name: {
            type: DataTypes.STRING,
        },
    },
    {
        tableName: 'ModalityTable',
        timestamps: false,
    }
);

// ------------------ SeriesTable ------------------
const SeriesTable = sequelize.define(
    'SeriesTable',
    {
        idSeries: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        idPatient: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        idStudy: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        idModality: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        SeriesName: {
            type: DataTypes.STRING,
        },
    },
    {
        tableName: 'SeriesTable',
        timestamps: true,
    }
);

// ------------------ FilesTable ------------------
const FilesTable = sequelize.define(
    'FilesTable',
    {
        idFile: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        idPatient: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        idStudy: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        idSeries: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        FilePath: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
    {
        tableName: 'FilesTable',
        timestamps: true,
    }
);

// 3) Define Relationships
// (a) PatientTable -> SeriesTable
PatientTable.hasMany(SeriesTable, { foreignKey: "idPatient" });
SeriesTable.belongsTo(PatientTable, { foreignKey: "idPatient" });

// (b) StudiesTable -> SeriesTable
StudiesTable.hasMany(SeriesTable, { foreignKey: "idStudy" });
SeriesTable.belongsTo(StudiesTable, { foreignKey: "idStudy" });

// (c) StudiesTable -> FilesTable
StudiesTable.hasMany(FilesTable, { foreignKey: "idStudy" });
FilesTable.belongsTo(StudiesTable, { foreignKey: "idStudy" });

// (d) PatientTable -> FilesTable
PatientTable.hasMany(FilesTable, { foreignKey: "idPatient" });
FilesTable.belongsTo(PatientTable, { foreignKey: "idPatient" });

// (e) SeriesTable -> FilesTable
SeriesTable.hasMany(FilesTable, { foreignKey: "idSeries" });
FilesTable.belongsTo(SeriesTable, { foreignKey: "idSeries" });

// (f) SeriesTable -> ModalityTable
ModalityTable.hasMany(SeriesTable, { foreignKey: "idModality" });
SeriesTable.belongsTo(ModalityTable, { foreignKey: "idModality" });

// 4) Sync DB - create or alter tables to match model definitions
(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("All models synchronized successfully.");
  } catch (error) {
    console.error("Error syncing models:", error);
  }
})();

// 5) Export Models + sequelize for usage
module.exports = {
  sequelize,
  PatientTable,
  StudiesTable,
  ModalityTable,
  SeriesTable,
  FilesTable,
};