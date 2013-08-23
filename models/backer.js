module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Backer", {
         userid: {type: DataTypes.STRING, unique: true, allowNull: false},
         name:   {type: DataTypes.STRING, unique: false, allowNull: false},
         email:  {type: DataTypes.STRING, unique: false, allowNull: false},
         amount: {type: DataTypes.FLOAT}
      });
}
