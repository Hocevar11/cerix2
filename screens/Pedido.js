import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert, useColorScheme, ScrollView} from 'react-native';
import { Button, Divider, FAB, IconButton, List, Modal, Portal, TextInput, Title, RadioButton } from 'react-native-paper';
import { useFocusEffect} from '@react-navigation/native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite'


export const Pedido = ({ navigation }) => {
  const [productosPendientes, setProductosPendientes] = useState([]);
  const [cliente, setCliente] = useState([]);
  const [numPedido, setNumPedido] = useState(1);
  const [nombre, setNombre] = useState('');

  const db = SQLite.openDatabase('sincronizar.db');

  useEffect(() => {
    obtenerCliente();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      guardarData();
    }, [])
  );

  const obtenerCliente = () => {
    AsyncStorage.getItem('cliente')
    .then(res => {
      if (res) {
        setCliente(JSON.parse(res));
        console.log(res);
      } else {
        setCliente([]);
      }
    });

    console.log(cliente);
  }

  const guardarData = () => {
    db.transaction((tx) => {
      tx.executeSql('SELECT * FROM pedido WHERE cliente = ?', [cliente.cliente], (_, { rows }) => {
        const datosPedido = rows._array;
        console.log(datosPedido);

        if (datosPedido.length > 0) {
          setProductosPendientes(datosPedido);
          console.log('Pedido cargado');
        } else {
          setProductosPendientes([]);
          console.log('No hay pedido pendiente');
        }
      });
    });

    AsyncStorage.getItem('nombre')
      .then(res => {
        if (res) {
          setNombre(res);
          console.log(res);
        } else {
          setNombre('');
        }
      });
  };

  let totalSumado = productosPendientes.reduce((total, item) => total + item.tota, 0);

  const renderPedido = () => {
    console.log(productosPendientes);
    if (productosPendientes.length > 0) {
      return productosPendientes.map((item) => {
        return (
          <List.Item
            key={item.id}
            title={item.descrip}
            titleNumberOfLines={2}
            description={'Bs. ' + item.preca + ' X ' + item.cana + ' = ' + item.tota}
            left={() => <List.Icon icon='shopping-outline' />}
            right = {props =>
              <TouchableOpacity onPress={() => eliminarProducto(item)} style = {{justifyContent: 'center'}}>
                  <List.Icon {...props} icon = 'close' color='red' />
              </TouchableOpacity>
          }
          />
        );
      });
    } else {
      return (
        <View>
          <Text>No hay productos pendientes</Text>
        </View>
      );
    }
  }

  const eliminarP = () => {
    db.transaction((tx) => {
      tx.executeSql('DELETE FROM pedido WHERE cliente = ?', [cliente.cliente], (tx, results) => {
        if (results.rowsAffected > 0) {
          console.log('Productos eliminados correctamente');
          guardarData();
        } else {
          console.log('No se eliminaron productos');
        }
      }, (error) => {
        console.log('Error al eliminar productos', error);
      });
    });
  }

  const eliminarProducto = (item) => {
      db.transaction((tx) => {
        tx.executeSql('DELETE FROM pedido WHERE id = ?', [item.id], (tx, result) => {
          if(result.rowsAffected > 0){
            guardarData();
          }else{
            Alert.alert('Error', 'No se pudo eliminar el producto');
          }
        })
      })
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 10 }}>  

        {cliente.nombre ? (
          <>
            <Text variant='titleLarge'>{cliente?.nombre}</Text>
            <Text>Vendedor: {nombre} </Text>

            <View style={{ flexDirection: 'row', marginTop: 15, borderTopWidth: 1, borderBottomWidth: 1, padding: 5, borderRadius: 1, justifyContent: 'space-around' }}>
              <Text variant='titleMedium'> Renglones: </Text>
              <Text variant='titleMedium' style={{ color: 'red' }}>{productosPendientes.length}</Text>
              <Text variant='titleMedium'> Total: </Text>
              <Text variant='titleMedium' style={{ color: 'red' }}>{totalSumado}</Text>
            </View>
            <ScrollView>
              <List.Section>
                <List.Subheader style={{alignContent:'center', justifyContent:'center'}}>Productos pendientes</List.Subheader>
                {renderPedido()}
              </List.Section>
            </ScrollView>
          </>
        ): (
          <View style = {{justifyContent:'center', alignContent:'center'}}>
            <Text>Debe seleccionar un cliente primero</Text>
          </View>
        )}
      </View>
      <FAB
        icon='delete-sweep-outline'
        style={styles.fab}
        onPress={() => {
          if (productosPendientes.length > 0) {
            Alert.alert(
              'Atencion',
              'Desea eliminar todos los productos?',
              [{ text: 'Cancelar', style: 'cancel'}, {text: 'Ok', 
              onPress: () => eliminarP() }]
            )
          } else {
            alert('No hay productos en el carrito');
          }
        }}
      />
    </View>
  );
}

  const styles = StyleSheet.create({
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
  })
  