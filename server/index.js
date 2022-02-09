require('dotenv').config();
const express = require('express');
const sql = require('sql');
sql.setDialect('postgres');
const dotenv =  require('dotenv/config');
const app = express();
const port = 3001;
const {Client} = require('pg');
//Esta paqueteria nos ayuda a formatear las fechas
const moment = require('moment');
moment.locale('es-mx');

const client = new Client({ //en esta seccion, conectamos la base de datos al cliente
    user: process.env.pg_usuario,
    host: process.env.pg_host,
    database: process.env.pg_database,
    password: process.env.pg_password,
    port: process.env.pg_port
});

client.connect(); //aqui vamos a verificar la funcionalidad y correcta conexion del cliente

client.query('select now()', (err, res) => {
    console.log(err,res);
})

const gastos = sql.define({
    name: 'gastos',
    columns: ['id', 'created_at', 'amount']
})

app.get('/', (req, res) => {
    res.send('Estas en la pagina principal');
});

app.get('/saludo', (req, res) => {
    res.send('Hola Mundo');
}); 

app.get('/registro/:valor', (req, res) => {
    const params = req.params;
    const amount = req.params.valor;
    const query =  {
        text: 'INSERT INTO gastos (amount) VALUES($1)',
        values: [amount]
    }
    client.query(query, (err,respuesta) => {
        if (err) {
            console.log(err.stack);
            return res.send('Hubo un error :(')
        } else {
            console.log(respuesta.rows[0]);
            return res.send('Se acaba de registrar un gasto por $' + (amount));
        }
    })
})

app.get('/lista',(req,res) => { //En este bloque, vamos a imprimir todos los gastos registrados
    //Consultaremos la basa de datos y obtendremos toda la info
    client.query('SELECT * FROM "gastos";', (err, postgresRes) => {
        //en dado caso que obtengamos un error, ejecutaremos este codigo.
        if(err) {
            console.log(err);   
        } else { //de lo contrario, ejecutamos este otro que dara formato a cada uno de los gastos
            const lista_gastos = postgresRes.rows;
            const gastos_formatted = lista_gastos.map(gasto => {
                const parsedDate = moment(gasto.created_at).format('LLL');
                return `<p id='${gasto.id}'>${parsedDate} : $${gasto.amount}</p>`
            });
            const stringFormatted = gastos_formatted.join("");
            return res.status(200).send(stringFormatted);
        }
        //Mandar la lista al front
        res.status(403).send('Estamos trabajando para volver pronto');
    });
})

app.get('/borrar/:id', (req,res) => {
    const idGasto = req.params.id;
    const query = {
        text: 'DELETE FROM gastos WHERE gastos.id=$1;',
        values: [idGasto],
    }
    client.query(query, (err,postgresRes) => {
        if(err) {
            console.log(err);
            return res.send('Hubo un error al borrar :(');
        } else {
            if(postgresRes.rowCount === 0) {
                return res.send('No encontre el valor a eliminar :(')
            } else {
                return res.send(`El gasto con ID ${idGasto} fue eliminado correctamente :D`);
            }
        }
    });
})

app.listen(port, (req, res) => {
    console.log('este server esta vivito y coleando');
})