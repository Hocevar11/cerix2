import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert, useColorScheme} from 'react-native';
import { Button, FAB, IconButton, List, Modal, PaperProvider, Portal, TextInput, Text as Rtext } from 'react-native-paper';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeLoadingSpinnerOverlay from 'react-native-loading-spinner-overlay';
import axios from 'axios';
import * as SQLite from 'expo-sqlite/legacy'


export const Sincronizar = ({url, navigation}) => {
    const [nombre, setNombre] = useState('');
    const [fecha, setFecha] = useState('');
    const [loading, isLoading] = useState(false);

    //Para el modal 
    const [messageModalVisible, setMessageModalVisible] = useState(false);
    const [requiredMessageModalProps, setRequiredMessageModalProps] = useState({});
    
    useEffect(() => {
        AsyncStorage.getItem('nombre')
        .then(res => {
            if(res){
                setNombre(res);
                console.log(res);
            }
        })

        AsyncStorage.getItem('fecha')
        .then(res => {
            if(res){
                setFecha(res);
                console.log(res);
            }
        })

        crearTablas();
    }, [])

    useEffect(() => {
        AsyncStorage.setItem('fecha', fecha);
    },[fecha])

    const db = SQLite.openDatabase('sincronizar.db');

    const crearTablas = () => {
        db.transaction(
          (tx) => {
            tx.executeSql(
              'CREATE TABLE IF NOT EXISTS pedido (id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT, descrip TEXT, cana TEXT, preca DOUBLE, tota DOUBLE, precad DOUBLE, iva DOUBLE, cliente TEXT, montoIva DOUBLE)',
              [],
              () => console.log('Tabla de pedidos creada correctamente'),
              (_, error) => {
                console.error('Error al crear tabla de pedidos', error);
                return false;
              }
            );
            tx.executeSql(
              'CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY AUTOINCREMENT, cliente TEXT, nombre TEXT, grupo TEXT, limite DOUBLE, dialimi INT, dire TEXT, ciudad1 TEXT, telefono TEXT, email TEXT, rifci TEXT, facts TEXT, devo TEXT, vencido DOUBLE)',
              [],
              () => console.log('Tabla de clientes creada correctamente'),
              (_, error) => {
                console.error('Error al crear tabla de clientes', error);
                return false;
              }
            );
            tx.executeSql(
              'CREATE TABLE IF NOT EXISTS inventario (id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT, descrip TEXT, tipo TEXT, prov1 TEXT, precio1 DOUBLE, precio2 DOUBLE, precio3 DOUBLE, precio4 DOUBLE, preciod1 DOUBLE, preciod2 DOUBLE, preciod3 DOUBLE, preciod4 DOUBLE, marca TEXT, iva DOUBLE, existen INT, pagina INT, imageUrl TEXT)',
              [],
              () => console.log('Tabla de inventario creada correctamente'),
              (_, error) => {
                console.error('Error al crear tabla de inventario', error);
                return false;
              }
            );
          },
          (error) => {
            console.error('Error en la transacción de crear tablas', error);
          }
        );
    };

    const descargarData = async () => {
        crearTablas();
        isLoading(true);
        try {
          const response = await axios.post(`${url}clientes`);
          const clientesData = response.data;
    
          db.transaction((tx) => {
            tx.executeSql('DELETE FROM clientes');
            clientesData.forEach((cliente) => {
              tx.executeSql(
                'INSERT INTO clientes (cliente, nombre, grupo, limite, dialimi, dire, ciudad1, telefono, email, rifci, facts, devo, vencido) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  cliente.cliente,
                  cliente.nombre,
                  cliente.grupo,
                  cliente.limite,
                  cliente.dialimi,
                  cliente.dire,
                  cliente.ciudad1,
                  cliente.telefono,
                  cliente.email,
                  cliente.rifci,
                  cliente.facts,
                  cliente.devo,
                  cliente.vencido,
                ]
              );
            });
          });
    
          const invresponse = await axios.post(`${url}inventario`);
          const inventarioData = invresponse.data;
    
          db.transaction((tx) => {
            tx.executeSql('DELETE FROM inventario');
            inventarioData.forEach((inv) => {
              tx.executeSql(
                'INSERT INTO inventario (codigo, descrip, tipo, prov1, precio1, precio2, precio3, precio4, preciod1, preciod2, preciod3, preciod4, marca, iva, existen, pagina, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  inv.codigo,
                  inv.descrip,
                  inv.tipo,
                  inv.prov1,
                  inv.precio1,
                  inv.precio2,
                  inv.precio3,
                  inv.precio4,
                  inv.preciod1,
                  inv.preciod2,
                  inv.preciod3,
                  inv.preciod4,
                  inv.marca,
                  inv.iva,
                  inv.existen,
                  inv.pagina,
                  inv.imageUrl,
                ]
              );
            });
          });
    
          setFecha(new Date().toLocaleString('es-ES'));
          isLoading(false);
          alert('Datos de clientes e inventario ingresados correctamente');
        } catch (error) {
          alert('Error al obtener los datos de la API: ' + error);
          isLoading(false);
        }
    };

    const eliminarData = async () => {
        isLoading(true);
        try {
          db.transaction((tx) => {
            tx.executeSql('DELETE FROM clientes');
            tx.executeSql('DELETE FROM inventario');
            tx.executeSql('DELETE FROM pedido');

            AsyncStorage.removeItem('cliente');
          });
          isLoading(false);
          Alert.alert('Atención', 'Clientes e inventario eliminados');

        } catch (error) {
            
          alert(error);
          isLoading(false);
        }
      };
    

    return(
        <View style = {{flex:1, paddingHorizontal: 10, backgroundColor:'#f0f5f9'}}>
            <View style = {{alignItems:'center', marginBottom: 10}}>
                <Rtext style = {{fontWeight:'900', fontSize: 24, color:'#173f5f'}}>Sincronizacion de Data </Rtext>
            </View>

            <View style = {{padding:15, margin:5, backgroundColor:'#fff', borderRadius:5, elevation:5}}>
                <Text style = {{color:'#4d4d4d'}}>Vendedor: {nombre}</Text>
                <Text style = {{color:'#4d4d4d'}}>Ultima Sincronizacion: {fecha}</Text>

              <View style = {{flexDirection:'row', justifyContent: 'space-around'}}>
                  <Button 
                    icon='arrow-collapse-down' 
                    mode='elevated' 
                    onPress={() => descargarData()} 
                    style = {{marginTop: 15, borderRadius:10}} 
                    buttonColor='#173f5f' 
                    textColor='white' >
                      Descargar Data
                  </Button>

                  <Button 
                    icon='trash-can-outline' 
                    buttonColor='#5f1717' 
                    mode='elevated' 
                    onPress={() => eliminarData()} 
                    textColor='white'
                    style = {{marginTop: 15, borderRadius:10}} >
                      Eliminar Data
                  </Button>
              </View>
            </View>

            <ReactNativeLoadingSpinnerOverlay visible={loading} />
        </View>
    )
}