import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator} from 'react-native';
import { Button, Divider, FAB, IconButton, Modal, Portal, TextInput, RadioButton, Card, Badge} from 'react-native-paper';
import { useFocusEffect} from '@react-navigation/native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite/legacy'
import Imagen804 from '../assets/804.png';
import { Image } from 'expo-image';

export const Inventario = ({navigation, route }) => {
    const { actualizar } = route.params || {}; 
    const [inventario, setInventario] = useState([]);
    const [inventarioFiltradot, setInventarioFiltrado] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [modalvisible, setModalVisible] = useState(false);
    const [precioSeleccionado, setPrecioSeleccionado] = useState('precio1');
    const [cantidadSeleccionada, setCantidadSeleccionada] = useState('1');
    const [cliente, setCliente] = useState([]);
    const [mostrarFotos, setMostrarFotos] = useState(false);
    const [loading, setLoading] = useState(false);
    const [carrito, setCarrito] = useState([]);
    const [badgeCount, setbadgeCount] = useState(0);

    //Para alternar entre vista de lista y de tabla
    const [numColumns, setNumColumns] = useState(2);
    const [columnVista, setColumnVista] = useState(true);

    //Para la paginacion infinita
    const [pagina, setPagina]  = useState(1);
    const [detalles, setDetalles] = useState(false);

    const preciosDisponibles = ['precio1', 'precio2', 'precio3', 'precio4'];

    const db = SQLite.openDatabase('sincronizar.db');

    useFocusEffect(
        React.useCallback(()  => {
            obtenerCliente();
            setPagina(1); // Establece la página inicial como 1 si el inventario está vacío
            console.log(inventario);
        }, [])
    );

    useFocusEffect(
        React.useCallback(()  => {
            if(actualizar){
                refrescar();
            }
        }, [actualizar])
    )

    useEffect(() => {
        guardarData(pagina);
        guardaInvTotal();
    },[])

    useEffect(() => {
        refrescar();
    }, [actualizar])

      
    const obtenerCliente = () => {
        AsyncStorage.getItem('cliente').then(res => {
            if (res) {
                setCliente(JSON.parse(res));
            } else {
                setCliente([]);
            }
        });
    }

    const carritoCli = (cliente) => {
         db.transaction((tx) => {
             tx.executeSql('SELECT * FROM pedido WHERE cliente = ?', [cliente], (_, {rows}) => {
                const nuevosRegistros = rows._array;
                setbadgeCount(nuevosRegistros.length);
                
                if (nuevosRegistros.length > 0) {
                  // Filtra los nuevos registros para excluir duplicados
                  const registrosNoDuplicados = nuevosRegistros.filter((nuevoRegistro) => {
                    return !carrito.some((registroExistente) => registroExistente.id === nuevoRegistro.id);
                  });
        
                  console.log('esta entrando en true');
                  setCarrito(nuevosRegistros);
                  console.log('Carrito Agregado');
                } else {
                  console.log('esta entrando en false')
                  setCarrito([]);
                }

            })
        })
    }

    const guardaInvTotal = () => {
        setLoading(true);
        const buscar = `%${busqueda.toUpperCase()}%`; // Añadir comodines para LIKE
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT * FROM inventario ORDER BY id ASC ', [],
                (_, { rows }) => {
                    const nuevosRegistros = rows._array;
                    console.log(nuevosRegistros);
                    if (nuevosRegistros.length > 0) {
                        // Filtra los nuevos registros para excluir duplicados
                        const registrosNoDuplicados = nuevosRegistros.filter((nuevoRegistro) => {
                            return !inventario.some((registroExistente) => registroExistente.id === nuevoRegistro.id);
                        });
    
                        setInventarioFiltrado(nuevosRegistros);
                        console.log('Productos agregados');
                        setLoading(false);
                    } else {
                        console.log('No hay inventario que agregar');
                        setLoading(false);
                    }
                },
                (error) => {
                    console.log('Error en la consulta SQL:', error);
                    setLoading(false); // Asegúrate de manejar adecuadamente la lógica en caso de error
                }
            );
        });
    }
      
    const guardarData = () => {
        setLoading(true);
        const buscar = `%${busqueda.toUpperCase()}%`; // Añadir comodines para LIKE
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT * FROM inventario WHERE pagina <= ? ORDER BY id ASC ', [pagina],
                (_, { rows }) => {
                    const nuevosRegistros = rows._array;
                    console.log(nuevosRegistros);
                    if (nuevosRegistros.length > 0) {
                        // Filtra los nuevos registros para excluir duplicados
                        const registrosNoDuplicados = nuevosRegistros.filter((nuevoRegistro) => {
                            return !inventario.some((registroExistente) => registroExistente.id === nuevoRegistro.id);
                        });
    
                        setInventario(nuevosRegistros);
                        console.log('Productos agregados');
                        setLoading(false);
                    } else {
                        console.log('No hay inventario que agregar');
                        setLoading(false);
                    }
                },
                (error) => {
                    console.log('Error en la consulta SQL:', error);
                    setLoading(false); // Asegúrate de manejar adecuadamente la lógica en caso de error
                }
            );
        });
    };
    
      
    //Funcion que agrega los productos al carrito
    const agregarProductos = (producto) => {
        
        setProductoSeleccionado(producto);
        setModalVisible(true);
    };

    const toggleChangeColumns = () => {
        if(numColumns == 1){
            setNumColumns(2);
            setColumnVista(true);
        }else{
            setNumColumns(1);
            setColumnVista(false);
        }
    }

    const mostrarDetalles = () => {
        setDetalles(!detalles);
    }

    const handleEndReached = () => {
        // Incrementa la página y carga los nuevos datos
        if(!loading && busqueda == ''){
            setPagina((prevPagina) => prevPagina + 1);
            guardarData();
        }
    };

    const MemoizedProductItem = React.memo(({ item, mostrarFotos, detalles, numColumns }) => {
        const isItemInCart = item.cantidadEnCarrito > 0;
        const buttonText = isItemInCart ? 'Aumentar' : 'Agregar';
        const buttonColor = isItemInCart ? '#2ba637' : '#173f5f'; // Cambia el color del botón si está en el carrito
      
        return(
          <View style={styles.itemContainer} > 
            <Card style={{ flex: 1, margin: 5, backgroundColor:'#fff', borderRadius:5}} mode='contained'>

                {mostrarFotos &&(
                    <View style = {{flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'}}>
                        <Image
                            style={numColumns === 1 ?  styles.cardImageColumn: styles.cardImage}
                            source={item.imageUrl == '' ? Imagen804: item.imageUrl}
                            contentFit="contain"
                            transition={500}
                        />
                    </View>
                )}

                <Card.Content>
                    {columnVista ? (
                        <>
                            <Text variant='labelLarge' numberOfLines={2} style = {{fontSize: 13,marginTop: 8, marginBottom:9, fontWeight:'bold', color:'#173f5f'}}>{item.descrip}</Text>
                            <View style = {{flexDirection:'row', justifyContent:'space-between', marginBottom:5}}>
                                <Text variant='bodyMedium' style = {{fontSize:12,color:'#173f5f', fontWeight:'bold'}}>Bs. {item.precio1.toFixed(2)} </Text>
                                <Text variant='bodyMedium' style = {{fontSize:12,color:'green'}}>Ref. {item.preciod1}</Text>
                            </View>
                            <Text variant='bodySmall' style = {{color:'#4d4d4d'}}>Disponibles: {item.existen}</Text>
                            <Text variant='bodySmall' style = {{color:'#4d4d4d'}}>Carrito: {item.cantidadEnCarrito}</Text>

                        </>

                    ): (
                        <>
                            <Text variant='bodyLarge' numberOfLines={2} style = {{marginTop: 5, marginBottom:4, fontWeight:'bold'}}>{item.descrip}</Text>
                            {detalles == true ? (
                                <View style = {{justifyContent:'space-between'}}>
                                    <View style = {{paddingHorizontal: 0, marginBottom: 5, flexDirection:'row'}}>
                                        <Text variant='bodyMedium' style = {{color:'#173f5f',fontWeight:'bold', fontSize: 15}}>Bs. {item.precio1.toFixed(2)} </Text>
                                        <Text variant='bodyMedium' style = {{color:'green', fontWeight:'bold'}}>Ref. {item.preciod1}</Text>
                                    </View>
                                </View>
                                
                            ):(
                                <View style = {{justifyContent:'space-between'}}>
                                    <Text variant='bodyMedium' style = {{marginBottom: 5}}>Precios:</Text>
                                    <View style = {{paddingHorizontal: 8, marginBottom: 5}}>
                                        <Text variant='bodyMedium' style = {{color:'#173f5f', fontWeight:'bold', fontSize: 15}}>Bs. {item.precio1.toFixed(2)} </Text>
                                        <Text variant='bodyMedium' style = {{color:'green',   fontWeight:'bold'}}>Ref. {item.preciod1}</Text>
                                    </View>
                                    <View style = {{flexDirection:'row', justifyContent:'space-between', padding: 2}}>
                                        <Text variant='bodyMedium' style = {{color:'#4d4d4d'}}>Disponibles: {item.existen}</Text>
                                        <Text variant='bodyMedium' style = {{color:'#4d4d4d'}}>Carrito: {item.cantidadEnCarrito}</Text>
                                    </View>
                                </View>
                            )}
                        </>
                    )}
                    <View style = {{marginTop:7, padding:0}}>
                    <Button 
                    mode='contained-tonal' 
                    buttonColor={buttonColor}
                    compact = {true}
                    textColor='white'
                    style = {{borderRadius:8,}}
                    onPress={() => agregarProductos(item)}>{buttonText}</Button>
                
                    </View>
                </Card.Content>
            </Card>
            </View>
        )
      
    });

    const actualizaCantidad =  () => {

        const listaConCantidad = inventario.map((producto) => {
            const productoEnCarrito = carrito.find((productoCarrito) => productoCarrito.codigo === producto.codigo && productoCarrito.cliente === cliente.cliente);
            const cantidadEnCarrito = productoEnCarrito ? productoEnCarrito.cana : 0;

            return {...producto, cantidadEnCarrito};
        })

        const listaConCantidad2 = inventarioFiltradot.map((producto) => {
            const productoEnCarrito = carrito.find((productoCarrito) => productoCarrito.codigo === producto.codigo && productoCarrito.cliente === cliente.cliente);
            const cantidadEnCarrito = productoEnCarrito ? productoEnCarrito.cana : 0;

            return {...producto, cantidadEnCarrito};
        })

        inventario.splice(0, inventario.length, ...listaConCantidad);
        inventarioFiltradot.splice(0, inventarioFiltradot.length, ...listaConCantidad2);
        //console.log('carrito desde actualizar cantidad');
        //console.log(carrito);
    
    }
  

    const renderInventario = () => {
        actualizaCantidad();

        const inventarioFiltrado = inventarioFiltradot.filter((item) =>
          item.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
          item.descrip.toLowerCase().includes(busqueda.toLowerCase())
        );


        const renderItem = useCallback(({ item }) => (
            <MemoizedProductItem
                item={item}
                mostrarFotos={mostrarFotos}
                detalles={detalles}
                numColumns={numColumns}
            />
        ), [mostrarFotos, detalles, numColumns])

        //const keyExtractor = React.useCallback((item) => item.id.toString(), []);
        
        return (
            <FlatList
            data={ busqueda == '' ? inventario : inventarioFiltrado}
            key={numColumns}
            renderItem={renderItem}
            numColumns={numColumns}
            contentContainerStyle={styles.flatListContainer}
            removeClippedSubviews={true}
            onEndReached={handleEndReached}
            ListFooterComponent={() => (
                // Componente que se renderizará al final de la lista
                loading && <ActivityIndicator size="large" color="#2b6fa6" style={styles.loadingIndicator} />
            )}
            />
        );
    };

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
        let montoIva = 0;

        if(productoSeleccionado.iva > 0) {
            montoIva = (tota * productoSeleccionado.iva) / 100;

        }

        console.log(montoIva);

        const coincide = carrito.find((c) => c.codigo == codigo && c.cliente == cliente.cliente);
        

        if (coincide) {
            db.transaction((tx) => {-
                 tx.executeSql(
                    'UPDATE pedido SET cana =?, preca =?, tota =?, precad =?, iva =?, montoIva = ? WHERE codigo =? AND cliente =?',
                    [cana, preca, tota, precad, productoSeleccionado.iva, montoIva, codigo, cliente.cliente],
                    () => {
                        console.log('Producto actualizado correctamente');
                        carritoCli(cliente.cliente);
                    }
                )
            })
            
        }else{
            db.transaction((tx) => {
                 tx.executeSql(
                    'INSERT INTO pedido (codigo, descrip, cana, preca, tota, precad, iva, montoIva, cliente) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [codigo, descrip, cana, preca, tota, precad, productoSeleccionado.iva, montoIva, cliente.cliente],
                    () => {
                        console.log('Producto agregado correctamente');
                        carritoCli(cliente.cliente);
    
                    },
                    (error) => {
                        console.log('Error al agregar producto', error);
                    }
                );
            })

        }

        setCantidadSeleccionada('1');
        setModalVisible(false);
    }

    const toggleMostrarFotos = () => {
        setMostrarFotos(!mostrarFotos);
    };

    const refrescar = () => {
        setPagina(1);
        setInventario([]);
        setCarrito([]);
        carritoCli(cliente.cliente);
        actualizaCantidad();
        guardarData(pagina);
    }

    return(
        
        <View style = {{flex:1, backgroundColor:'#f0f5f9', padding:7}}>
            <View style = {{padding: 10}}>
                <View style = {{flexDirection:'row', justifyContent:'flex-start'}}>
                    <TextInput
                    placeholder='Buscar Productos...'
                    mode='flat'
                    value={busqueda}
                    dense={true}
                    style = {{backgroundColor: '#fff', elevation:5, width:'75%', marginRight: 20, borderRadius:5}}
                    underlineColor='transparent'
                    activeUnderlineColor='transparent'
                    cursorColor='black'
                    onChangeText={setBusqueda}
                    />

                    <IconButton
                    icon='shopping-search'
                    size={24}
                    mode='contained'
                    style = {{borderRadius:5, margin:0, backgroundColor:'#173f5f', width:'17%', elevation:5}}
                    iconColor='white'
                    />

                </View>
                <Portal>
                    <Modal visible = {modalvisible} onDismiss = {() => {setModalVisible(false); setCantidadSeleccionada('1')}} style = {{padding: 5}}>
                        <View style = {{padding: 25, backgroundColor: '#fff', borderRadius: 8}}>
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
                                        label={productoSeleccionado && productoSeleccionado[precio] ? 'Bs. '+productoSeleccionado[precio].toString()+'- $.'+productoSeleccionado?.preciod1 : ''}
                                        value={precio}
                                        status={precioSeleccionado === precio ? 'checked' : 'unchecked'}
                                        onPress={() => setPrecioSeleccionado(precio)}
                                        />
                                        <Divider />
                                    </View>
                                ))}
                            </View>
                            <View style = {{marginVertical:5, alignItems:'center'}}>
                                <Text variant='titleLarge' style = {{color:'#173f5f', fontWeight:'bold'}}>Disponible: {productoSeleccionado?.existen}</Text>
                                <Text variant='titleSmall' style = {{color:'green'}}>En carrito: {productoSeleccionado?.cantidadEnCarrito}</Text>
                            </View>
                            <TextInput
                                placeholder="Cantidad"
                                mode='flat'
                                style = {{backgroundColor: '#f0f5f9', elevation:5}}
                                underlineColor='transparent'
                                activeUnderlineColor='transparent'               
                                cursorColor='black'
                                value={cantidadSeleccionada}
                                dense={true}
                                onChangeText={(text) => {cambiaCantidad(text)}}
                                keyboardType="numeric"
                            />
                            <View style = {{alignItems:'center', marginTop: 10, marginBottom: 7}}>
                                <Text variant='titleMedium' style = {{color: 'red'}}>Sub-total: {precioTotalRedondeado}</Text>
                            </View>
                            <Button 
                            mode='contained-tonal' 
                            buttonColor='#173f5f' 
                            compact = {true}
                            textColor='white' 
                            style = {{borderRadius:8}}
                            onPress={() => agregarPedido()}>Agregar al pedido</Button>
                            
                        </View>
                    </Modal>
                </Portal>
                <View style={{padding: 0}}>
                    <View style = {styles.botonesContainer}>
                        <IconButton icon={mostrarFotos ? require('../assets/icons/camera.png'): require('../assets/icons/camera-off.png')}
                        iconColor='#173f5f'
                        style = {{margin: 0, padding: 0}}
                        size={28}
                        onPress={() => toggleMostrarFotos()} />

                        <IconButton icon={columnVista ? require('../assets/icons/grid.png'): require('../assets/icons/list.png')}
                        iconColor='#173f5f'
                        style = {{margin: 0, padding: 0}}
                        size={28}
                        onPress={() => toggleChangeColumns()} />

                        <IconButton icon={detalles ? require('../assets/icons/details-off.png'): require('../assets/icons/details.png')}
                        iconColor='#173f5f'
                        style = {{margin: 0, padding: 0}}
                        size={27}
                        onPress={() => mostrarDetalles()} />

                        <IconButton icon={require('../assets/icons/filters.png')}
                        iconColor='#173f5f'
                        style = {{margin: 0, padding: 0}}
                        size={27}
                        onPress={() => console.log('hola')} />


                        <IconButton icon={require('../assets/icons/refresh.png')}
                        iconColor='#173f5f'
                        style = {{margin: 0, padding: 0}}
                        size={27}
                        onPress={() => refrescar()} />

                        <IconButton icon={require('../assets/icons/cart.png')}
                        iconColor='#173f5f'
                        style = {{margin: 0, padding: 0}}
                        size={27}
                        onPress={() => navigation.navigate('Pedido', {cliente})} />
    
                        {badgeCount > 0 && (
                            <Badge style={styles.badge} size={20}> {badgeCount} </Badge>
                        )}

                    </View>
                </View>
            </View>
            {renderInventario()}
        </View>
    )


}

const styles = StyleSheet.create({
    flatListContainer: {
      padding: 8,

    },
    itemContainer: {
      flex: 1,
    },

    badge: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#173f5f', // Color del fondo del Badge
        color: '#FFFFFF', // Color del texto del Badge
    },

    cardImage: {
        height: 100,
        width: '100%',
        margin: 5
        
    },

    cardImageColumn: {
        height: 130,
        width: '100%',
        marginBottom: 5,
    },

    botonesContainer: {
        marginTop: 13,
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        backgroundColor:'#fff',
        width: '98%'
    },

    loadingIndicator: {
        marginVertical:20,
    }

  });