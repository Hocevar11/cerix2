import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert, useColorScheme, ScrollView} from 'react-native';
import { Button, Divider, FAB, IconButton, List, Modal, Portal, TextInput, Title, RadioButton } from 'react-native-paper';
import { useFocusEffect} from '@react-navigation/native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite'


export const Inventario = ({navigation}) => {
    const [inventario, setInventario] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [modalvisible, setModalVisible] = useState(false);
    const [precioSeleccionado, setPrecioSeleccionado] = useState('precio1');
    const [cantidadSeleccionada, setCantidadSeleccionada] = useState('1');
    const [cliente, setCliente] = useState([]);

    //Para la paginacion infinita
    const pagina  = 15;
    //const [productosVisibles, setProductosVisibles]   = useState([]);
    //const [productosRestantes, setProductosRestantes] = useState([]);
    const [indice, setIndice] = useState(0);



    const preciosDisponibles = ['precio1', 'precio2', 'precio3', 'precio4'];

    const db = SQLite.openDatabase('sincronizar.db');

    useFocusEffect(
        React.useCallback(() => {
            cargarDatos();
            if(inventario.length == []){
                setIndice(0);
                console.log('sex');
            }
            console.log(indice);
        },[])
    )

    const carritoCli = () => {
        db.transaction((tx) => {
            tx.executeSql('SELECT * cantidad FROM pedido WHERE cliente = ?', [cliente.cliente], (_, {rows}) => {
                console.log(rows._array);
            })
        })
    }

    const cargarDatos = () => {
        // Llama a la función guardarData con el índice actual y el tamaño de la página
        guardarData(indice, pagina);
      };
    

    //Funcion que guarda los productos en un objeto para despues mostrarlos 
    const guardarData = (indice, cantidad) => {
        db.transaction((tx) => {
          tx.executeSql('SELECT * FROM inventario ORDER BY id ASC    LIMIT ?, ?', [indice, cantidad], (_, { rows }) => {
            const nuevosRegistros = rows._array;

            if(nuevosRegistros.length > 0){
                setInventario([...inventario, ...nuevosRegistros]);
                console.log('Productos agregado');
                setIndice(indice+cantidad);
            }else{
                setInventario([]);
                console.log('No hay inventario que agregar');
            }
          });
        });

        AsyncStorage.getItem('cliente')
        .then(res => {
            if(res){
                setCliente(JSON.parse(res));
                console.log(res);
            }else{
                setCliente([]);
            }
            
        })
    };


    const handleScroll = (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const contentHeight = event.nativeEvent.contentSize.height;
        const screenHeight = event.nativeEvent.layoutMeasurement.height;

        if(offsetY + screenHeight >= contentHeight - 30 && busqueda == ''){
            cargarMasDatos();
        }
    }

    //Funcion que agrega los productos al carrito
    const agregarProductos = (producto) => {
        setProductoSeleccionado(producto);
        setModalVisible(true);
    };

    const cargarMasDatos = () => {
        cargarDatos();
    };

    const renderInventario = () => {
        const inventarioFiltrado = inventario.filter((item) => 
            item.codigo.toLowerCase().includes(busqueda) ||
            item.descrip.toLowerCase().includes(busqueda) 
            
        );

       // if(inventarioFiltrado.length < 100){
            return inventarioFiltrado.map((item) => {
                return(
                    <List.Item 
                    key={item.id} 
                    title = {item.descrip}
                    titleNumberOfLines = {2}
                    description = {'Bs. '+item.precio1+' $ '+item.preciod1+ ' Exis:'+item.existen}
                    left = {() => <List.Icon icon = 'shopping-outline' />} 
                    onPress = {() => {
                        agregarProductos(item);
                    }}
                    />
                )
            })
        /*}else{
            return(
                <View>
                    <Text>Ingrese descripcion o codigo en el buscador!</Text>
                </View>
            )
        }*/

    }
    const precioTotal = productoSeleccionado && productoSeleccionado[precioSeleccionado] ? (productoSeleccionado[precioSeleccionado] * cantidadSeleccionada) : 0;
    const precioTotalRedondeado = parseFloat(precioTotal.toFixed(2));

    const cambiaCantidad = (cant) => {
        if(cant > productoSeleccionado?.existen){
            setCantidadSeleccionada(productoSeleccionado.existen.toString());
        }else{
            
            setCantidadSeleccionada(cant);
        }
    }

    const agregarPedido = () => {
        if (!productoSeleccionado) {
            alert('No se ha seleccionado ningún producto');
            return;
        }
        
        if (!cantidadSeleccionada || cantidadSeleccionada <= 0) {
            alert('La cantidad seleccionada debe ser mayor que cero');
            return;
        }
    
        if (!precioSeleccionado || !productoSeleccionado[precioSeleccionado]) {
            alert('El precio seleccionado no es válido');
            return;
        }
    
        if (!precioTotalRedondeado || precioTotalRedondeado <= 0) {
            alert('El precio total no es válido');
            return;
        }
    
        if (!cliente || !cliente.cliente) {
            alert('No se ha seleccionado ningún cliente');
            return;
        }

        const { codigo, descrip } = productoSeleccionado;
        const cana = cantidadSeleccionada; 
        const preca = productoSeleccionado[precioSeleccionado];
        const tota = precioTotalRedondeado;
        const precad = productoSeleccionado.preciod1;

        db.transaction((tx) => {
             tx.executeSql(
                'INSERT INTO pedido (codigo, descrip, cana, preca, tota, precad, iva, cliente) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [codigo, descrip, cana, preca, tota, precad, productoSeleccionado.iva, cliente.cliente],
                () => {
                    console.log('Producto agregado correctamente');
                },
                (error) => {
                    console.log('Error al agregar producto', error);
                }
            );
        })
        setCantidadSeleccionada('1');
        setModalVisible(false);
        carritoCli();
    }

    return(
        <View style = {{flex:1}}>
            <View style = {{padding: 10}}>
                <Text variant='titleLarge' style = {{marginBottom:8}}>Inventario: ({inventario.length})</Text>
                <View style = {{padding: 7, borderRadius: 15, marginBottom: 8, justifyContent:'center', backgroundColor: '#dedede'}}>
                    <Text variant='labelSmall'>{cliente.cliente} {cliente.nombre}</Text>
                </View>
                <TextInput
                 label='Buscar Productos...'
                 mode='flat'
                 value={busqueda}
                 onChangeText={setBusqueda}
                 left = {<TextInput.Icon icon = 'shopping-search' />}
                 />
                <Portal>
                    <Modal visible = {modalvisible} onDismiss = {() => {setModalVisible(false); setCantidadSeleccionada('1')}} style = {{padding: 5}}>
                        <View style = {{padding: 25, backgroundColor: '#FFF', borderRadius: 8}}>
                            <Text variant='titleMedium'>{productoSeleccionado?.descrip}</Text>
                            <Text>Precios Disponibles:</Text>
                            <View style = {{marginVertical:15, justifyContent: 'space-between'}}>
                                {preciosDisponibles.map((precio) => (
                                    <View>
                                        <RadioButton.Item
                                        key={precio}
                                        labelVariant = 'bodyMedium'
                                        mode='ios'
                                        position='trailing'
                                        label={productoSeleccionado && productoSeleccionado[precio] ? productoSeleccionado[precio].toString()+'- $'+productoSeleccionado?.preciod1 : ''}
                                        value={precio}
                                        status={precioSeleccionado === precio ? 'checked' : 'unchecked'}
                                        onPress={() => setPrecioSeleccionado(precio)}
                                        />
                                        <Divider />
                                    </View>
                                ))}
                            </View>
                            <View style = {{marginVertical:5, alignItems:'center'}}>
                                <Text variant='titleLarge'>Disponible: {productoSeleccionado?.existen}</Text>
                            </View>
                            <TextInput
                                label="Cantidad"
                                value={cantidadSeleccionada}
                                onChangeText={(text) => {cambiaCantidad(text)}}
                                keyboardType="numeric"
                            />
                            <View style = {{alignItems:'center', marginTop: 10, marginBottom: 7}}>
                                <Text variant='titleMedium' style = {{color: 'red'}}>Sub-total: {precioTotalRedondeado}</Text>
                            </View>
                            <Button mode='elevated' onPress={() => agregarPedido()}>Agregar al pedido</Button>
                        </View>
                    </Modal>
                </Portal>
                <ScrollView onScroll={handleScroll}>
                    <List.Section>
                        <List.Subheader style = {{}}>Lista de Productos</List.Subheader>
                        {renderInventario()}
                    </List.Section>
                </ScrollView>

            </View>
        </View>
    )
}