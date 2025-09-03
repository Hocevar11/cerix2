import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, useColorScheme, ScrollView, FlatList, Text as Rtext} from 'react-native';
import { Button, Divider, FAB, IconButton, List, Modal, Text, Portal, TextInput, Title, RadioButton, Card, PaperProvider, Switch, SegmentedButtons, Searchbar } from 'react-native-paper';
import { useFocusEffect} from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite/legacy'
import { Image } from 'expo-image';
import Imagen804 from '../assets/804.png';
import axios from 'axios';
import ReactNativeLoadingSpinnerOverlay from 'react-native-loading-spinner-overlay';
import CustomAlert from '../resources/CustomAlert';


const CarritoContext = React.createContext();

export const Pedido = ({ route, navigation }) => {
  const [productosPendientes, setProductosPendientes] = useState([]);
  const [loading, isLoading] = useState(false);
  const [numPedido, setNumPedido] = useState(1);
  const [usuario,   setUsuario] = useState([]);
  const [actualizar, setActualizar] = useState(false);
  const [host, selectedHost] = useState([]);
  //const [value, setValue] = useState('');
  const [cmoneda, setCMoneda] = useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { cliente } = route.params;

  //Relaciado con la alerta
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const db = SQLite.openDatabase('sincronizar.db');

  useEffect(() => {

    AsyncStorage.getItem('datosUsuario').then(res => {
      console.log(res);
      if(res){
        setUsuario(JSON.parse(res));
      }
    })

    AsyncStorage.getItem('host').then(res => {
        console.log(res);
        if(res){
            selectedHost(JSON.parse(res));
        }else{
            selectedHost([]);
        }
    })
  }, [])

  const url = host.protocolo + host.host + '/' + host.ruta + '/sincro/movil';

  useFocusEffect(
    React.useCallback(() => {
      cargarData(cliente.cliente);
      console.log(cmoneda);
    }, [])
  );

  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  //******************************************************************
  // Funcion para guardar la data de los productos pedidos por cliente 
  //******************************************************************
  const cargarData = (cliente) => {
    db.transaction((tx) => {
      tx.executeSql('SELECT pedido.*, inventario.existen FROM pedido JOIN inventario ON pedido.codigo = inventario.codigo WHERE cliente = ?', [cliente], (_, { rows }) => {
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
  };

  const aumentarCant = (item) => {
    // Actualizar la cantidad y recalcular totales en la base de datos
    if(item.cana < item.existen){
      setActualizar(true);
      
      db.transaction((tx) => {
        tx.executeSql(
          'UPDATE pedido SET cana = cana + 1, tota = (cana + 1) * preca, montoIva = (cana + 1) * preca * iva / 100 WHERE id = ?',
          [item.id],
          (tx, result) => {
            if (result.rowsAffected > 0) {
              console.log('Cantidad aumentada correctamente');
              // Actualizar la lista de productos pendientes
              cargarData(cliente.cliente);
            } else {
              console.log('No se pudo aumentar la cantidad');
            }
          },
          (error) => {
            console.log('Error al aumentar la cantidad', error);
          }
        );
      });
    }else{
      Alert.alert('Error','No se pudo aumentar la cantidad maximo disponible: '+ item.existen);
    }
  };

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };


  const disminuirCant = (item) => {
    // Verificar si la cantidad es mayor a 1 para evitar cantidades negativas
    if (item.cana > 1) {
      // Actualizar la cantidad y recalcular totales en la base de datos
      db.transaction((tx) => {
        tx.executeSql(
          'UPDATE pedido SET cana = cana - 1, tota = (cana - 1) * preca, montoIva = (cana - 1) * preca * iva / 100  WHERE id = ?',
          [item.id],
          (tx, result) => {
            if (result.rowsAffected > 0) {
              console.log('Cantidad disminuida correctamente');
              setActualizar(true);
              cargarData(cliente.cliente);
            } else {
              console.log('No se pudo disminuir la cantidad');
            }
          },
          (error) => {
            console.log('Error al disminuir la cantidad', error);
          }
        );
      });
    } else {
      console.log('La cantidad ya es mínima (1), no se puede disminuir más.');
    }
  };
  
  //Totales
  let totalSumado  = productosPendientes.reduce((total, item) => total + item.tota, 0);
  let totaldSumado = productosPendientes.reduce((total, item) => total + (item.cana * item.precad), 0);

  let ivaSumado    = productosPendientes.reduce((iva, item) => iva + item.montoIva, 0);
  let ivadSumado   = productosPendientes.reduce((iva, item) => iva + (item.precad*item.iva*item.cana) / 100, 0);

  //Totales redondeados
  let total = totalSumado.toFixed(2);
  let totald = totaldSumado.toFixed(4);

  let iva  = ivaSumado.toFixed(2);
  let ivad = ivadSumado.toFixed(4);

  let totalGeneral = (totalSumado + ivaSumado).toFixed(2);
  let totalGenerald = (totaldSumado + ivadSumado).toFixed(4);
  

  const productosFiltrados = productosPendientes.filter((item) =>
    item.codigo.toUpperCase().includes(searchQuery.toUpperCase()) ||
    item.descrip.toUpperCase().includes(searchQuery.toUpperCase())
  );

  const renderPedidoItem = ({ item }) => {
    let ivaIndividual = item.montoIva ? (item.preca*item.iva) / 100 : 0;
    let ivaIndividuald = item.montoIva ? (item.precad*item.iva) / 100 : 0;
    

    return (
      <>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginVertical: 0, borderRadius:5}}>
          {/* Imagen del producto */}
          <Image
            style={{ width: '20%', height: 60, marginRight: 10 }} 
            source={Imagen804}
            contentFit="contain"
            transition={1000}
          />
    
          {/* Contenedor del nombre y detalles */}
          <View style={{ marginLeft: 5, width:'75%', padding: 5 }}>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Rtext numberOfLines={1} style={{ fontWeight:'900', color:'#173f5f', fontSize: 12}}>{item.descrip}</Rtext>
              </View>
              <IconButton
                icon={require('../assets/icons/close.png')}
                iconColor='red'
                size={15}
                onPress={() => eliminarProducto(item)}
              />
            </View>
    
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -5, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'column' }}>
                {cmoneda ? <Text variant='bodyMedium' style={{ fontWeight: '500', color:'green', fontSize:12 }}>Ref. {item.precad.toFixed(4)}</Text> : <Text variant='bodyMedium' style={{ fontWeight: '500', color:'#173f5f', fontSize:12 }}>Bs. {item.preca.toFixed(2)}</Text> }
                {cmoneda ? <Text variant='bodySmall' style = {{color:'green',fontSize:11}}>I.V.A. {ivaIndividuald.toFixed(4)}</Text>: <Text variant='bodySmall' style = {{color:'#4d4d4d', fontSize:11}}>I.V.A. {ivaIndividual.toFixed(2)}</Text>}
                
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent:'flex-end' }}>
                <IconButton
                  icon='minus'
                  iconColor='white'
                  mode='container'
                  containerColor='#173f5f'
                  size={16}
                  onPress={() => disminuirCant(item)}
                />
                <Rtext style={{ marginHorizontal: 10, color:'#173f5f', fontWeight:'900', fontSize:18}}>{item.cana}</Rtext>
                <IconButton
                  icon='plus'
                  iconColor='white'
                  mode='container'
                  containerColor='#173f5f'
                  size={16}
                  onPress={() => aumentarCant(item)}
                />
              </View>
            </View>
          </View>
        </View>
        <Divider />
      </>
      
    )
  }

  //Funcion para enviar el pedido
  const enviaPedido = async () => {
    try{
      if(productosPendientes.length > 0){
        isLoading(true)
        await axios.post(url+'/recibePedido/', {p: productosPendientes, cliente: cliente.cliente, user: usuario.usuario})
        .then((res) => {
          if(res.data.estatus == 'Pedido enviado'){
            setProductosPendientes([]);
            db.transaction((tx) => {
              tx.executeSql('DELETE FROM pedido WHERE cliente = ?',[cliente.cliente], (tx, result) => {
                if(result.rowsAffected > 0){
                  console.log('Pedido eliminado');
                  setActualizar(true);
                }else{
                  console.log('No se pudo eliminar el pedido');
                }
              });
            })
            showAlert('Exito', res.data.estatus);
          }else{

            showAlert('Alerta', res.data.estatus);
          }

          isLoading(false);
        })
      }else{
        alert('No hay productos en el pedido');
        isLoading(false);
      }

    }catch(error){
      alert(error);
      isLoading(false);
    }
  }

  /*const eliminarP = () => {
    db.transaction((tx) => {
      tx.executeSql('DELETE FROM pedido WHERE cliente = ?', [cliente.cliente], (tx, results) => {
        if (results.rowsAffected > 0) {
          console.log('Productos eliminados correctamente');
          cargarData(cliente.cliente);
        } else {
          console.log('No se eliminaron productos');
        }
      }, (error) => {
        console.log('Error al eliminar productos', error);
      });
    });
  }*/

  //Para cambiar la moneda
  const cambiarMoneda = () => {
    setCMoneda(!cmoneda);
  }

  //Funcion para eliminar el producto
  const eliminarProducto = (item) => {
    setActualizar(true);
    db.transaction((tx) => {
      tx.executeSql('DELETE FROM pedido WHERE id = ?', [item.id], (tx, result) => {
        if(result.rowsAffected > 0){
          cargarData(cliente.cliente);
          console.log(actualizar);
        }else{
          Alert.alert('Error', 'No se pudo eliminar el producto');
        }
      })
    })
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.encabezado}>
          {cliente.nombre ? (
            <>
              <View style = {{backgroundColor:'#f0f5f9', paddingHorizontal:10, paddingVertical: 6}}>
                <View style = {{flexDirection:'row', justifyContent:'flex-start'}}>
                    <TextInput
                    placeholder='Buscar...'
                    mode='flat'
                    value={searchQuery}
                    dense={true}
                    style = {{backgroundColor: '#fff', elevation:5, width:'75%', marginRight: 20, borderRadius:5}}
                    underlineColor='transparent'
                    activeUnderlineColor='transparent'
                    cursorColor='black'
                    onChangeText={setSearchQuery}
                    />

                    <IconButton
                    icon= {require('../assets/icons/cart-check-white.png')}
                    size={24}
                    mode='contained'
                    style = {{borderRadius:5, margin:0, backgroundColor:'#173f5f', width:'17%', elevation:5}}
                    iconColor='white'
                    />

                </View>

              </View>
              <View style={styles.infoCliente}>
                <IconButton icon="arrow-left-thick" iconColor='#173f5f' size={25}  onPress={() => navigation.navigate('InvScreen', {actualizar}) } />
                <Rtext numberOfLines={2} style={styles.nombreCliente}>{cliente?.nombre}</Rtext>
              </View>
              <View style={styles.scrollContainer}>

                <FlatList
                  data={productosFiltrados}
                  style = {{backgroundColor:'white', padding: 5, borderRadius:5}}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderPedidoItem}
                  />
              </View>


            <View style = {{backgroundColor:'#f0f5f9', padding:5}}>
                <View style = {styles.resumen}>
                  <Text variant='bodySmall' style={{ color:'black', fontSize:15}}>Subtotal</Text>
                  {cmoneda ? <Text variant='bodySmall' style={{ color:'green', fontSize:15}}>Ref.{totald}</Text>: <Text variant='bodySmall' style={{ color:'black', fontSize:15}}>Bs.{total}</Text>}
                  
                </View>

                <Divider />

                <View style={styles.resumen}>
                  <Text variant='bodySmall' style={{ color:'black', fontSize:15}}>I.V.A</Text>
                  {cmoneda ? <Text variant='bodySmall' style={{ color:'green', fontSize:15}}>Ref.{ivad}</Text>: <Text variant='bodySmall' style={{ color:'black', fontSize:15}}>Bs.{iva}</Text>}
                </View>

                <Divider />

                <View style={styles.resumen}>
                  <Text variant='titleMedium' style={{ color:'black', fontSize:16, fontWeight:'bold' }}>Total</Text>
                  {cmoneda ? <Text variant='titleMedium' style={{ color:'green', fontSize:17, fontWeight:'bold' }}>Bs.{totalGenerald}</Text>: <Text variant='titleMedium' style={{ color:'black', fontSize:17, fontWeight:'bold' }}>Bs.{totalGeneral}</Text>}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Button 
                    mode='contained-tonal' 
                    buttonColor='#173f5f' 
                    textColor='white' 
                    style={{ flex: 1, borderRadius: 8, marginRight: 10 }}
                    onPress={() => enviaPedido()}>
                    Enviar Pedido
                  </Button>
                  <Button 
                    mode='contained-tonal' 
                    buttonColor={cmoneda ? '#2ba633' : '#173f5f' }
                    textColor='white' 
                    style={styles.currencyButton}
                    onPress={() => cambiarMoneda()}>
                    {cmoneda ? '$': 'Bs.'}
                  </Button>
                </View>
            </View> 
            </>
          ) : (
            <View style={styles.sinCliente}>
              <Text>Debe seleccionar un cliente primero</Text>
            </View>
          )}
        </View>
          <CustomAlert
            visible={alertVisible}
            hideDialog={hideAlert}
            title={alertTitle}
            message={alertMessage}
          />

          <ReactNativeLoadingSpinnerOverlay visible={loading} />

      </View>
  </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#f0f5f9',
    padding:7
  },

  currencyButton: {
    borderRadius: 8,
  },
  encabezado: {
    padding: 0,
    flex: 1,
  },
  infoCliente: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
  },
  nombreCliente: {
    fontWeight: '900',
    fontSize: 18,
    color:'#193d5d'
  },
  scrollContainer: {
    borderRadius: 10,
    flex:1,
    padding:7,
  },
  subtitulo: {
    alignContent: 'center',
    justifyContent: 'center',
  },
  resumen: {
    flexDirection: 'row',
    padding: 5,
    marginTop: 4,
    justifyContent: 'space-between',
    backgroundColor:'#f0f5f9',
  },
  sinCliente: {
    justifyContent: 'center',
    alignContent: 'center',
  },
  iconButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    
    backgroundColor: 'green', // Cambia el color según tus preferencias
  },
});