const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});


// Crea y firma un JWT
const crearToken = (usuario, secreta, expiresIn) => {
    console.log(usuario);
    const { id, email } = usuario;

    return jwt,jwt.sign( { id, email }, secreta, { expiresIn });
}

const resolvers = {
    Query: {
        
    },
    Mutation: {
        crearUsuario: async (_, {input}) => {
            const { email, password } = input;

            // Verifica si existe un usuario registrado con un correo
            const existeUsuario = await Usuario.findOne({ email });

            // Si el usuario existe
            if(existeUsuario) {
                throw new Error('El usuario ya está registrado');
            }

            try {

                //Hashear Password
                const salt = await bcryptjs.genSalt(10);
                input.password = await bcryptjs.hash(password, salt);

                // Registrar nuevo usuario

                const nuevoUsuario = new Usuario(input);
                //console.log(nuevoUsuario);

                nuevoUsuario.save();
                return "Usuario Creado Correctamente";
            } catch (error) {
                console.log(error);
            }
        },
        autenticarUsuario: async (_, {input}) => {
            const { email, password } = input;

            // Si el usuario existe
            const existeUsuario = await Usuario.findOne({ email });

            // Si el usuario existe
            if(!existeUsuario) {
                throw new Error('El usuario no existe');
            }

            // Si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
            
            if(!passwordCorrecto) {
                throw new Error('Password Incorrecto');
            }

            // Dar acceso a la app
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '2hr')
            }
        },
        nuevoProyecto: async (_, {input}, ctx) => {

            try {
                const proyecto = new Proyecto(input);

                // Asociar el creador
                proyecto.creador = ctx.usuario.id;

                // Almacenar en la BD
                const resultado = await proyecto.save();


                return resultado;
            } catch (error) {
                console.log(error);
            }
        }
    }
}

module.exports = resolvers;