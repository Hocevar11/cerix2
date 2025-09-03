import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Image, Alert, ImageBackground} from 'react-native';
import { Button, PaperProvider, TextInput, Text, IconButton, Checkbox, DefaultTheme, Provider } from 'react-native-paper';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {NavigationContainer, useFocusEffect} from '@react-navigation/native';
import { Hosts } from './Hosts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainScreen } from './screens/Main';
import axios from 'axios';
import ReactNativeLoadingSpinnerOverlay from 'react-native-loading-spinner-overlay';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import  Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Sincronizar } from './screens/Sincronizar';
import { Inventario } from './screens/Inventario';
import { Pedido } from './screens/Pedido';
import { Historial } from './screens/Historial';
import { EfectosP } from './screens/EfectosP';
import { DetallePedido } from './screens/Detalle';
import {enableScreens} from 'react-native-screens'


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const Inv = createNativeStackNavigator();
const Hist = createNativeStackNavigator();

enableScreens();

const ligthTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
    placeholder: '#a1a1a1',
    disabled: '#f0f0f0',
  },

}

export function App({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [clave,   setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [selectedHost, setSelectedHost] = useState([]);
  const [url, setUrl] = useState('');
  const [loading, isLoading] = useState(false);
  const [checked, setChecked] = useState(false);


  const toggleMostrarClave = () => {
    setMostrarClave(!mostrarClave);
  }

  useFocusEffect(
    React.useCallback(() => {

      const verHost = async () => {
        try {
          const hostG = await AsyncStorage.getItem('host');
          if (hostG) {
            const parsedHost = JSON.parse(hostG);
            setSelectedHost(parsedHost);
            const constructedUrl = `${parsedHost.protocolo}${parsedHost.host}/${parsedHost.ruta}/sincro/c_movil/`;
            setUrl(constructedUrl);
            console.log('URL construida:', constructedUrl);
      
            const datosGuardados = await AsyncStorage.getItem('datosUsuario');
            if (datosGuardados) {
              const { clave, usuario, checked } = JSON.parse(datosGuardados);
              if (checked) {
                setUsuario(usuario);
                setClave(clave);
              }
              navigation.navigate('Main', { url: constructedUrl, titulo: parsedHost.nombre });
            } else {
              console.log('No hay datos guardados');
            }
          }
        } catch (error) {
          console.log('Error al obtener el host:', error);
        }
      };
      
      verHost();
    },[])
  );

  useEffect(() => {
    setUrl(selectedHost.protocolo+selectedHost.host+'/'+selectedHost.ruta+'/sincro/c_movil/');
  },[selectedHost])


  const Login = async () => {
    if (selectedHost.nombre) {
      if (usuario && clave) {
        isLoading(true);
        try {
          const fullUrl = `${url}login`;
          console.log('Intentando conectarse a:', fullUrl);
          
          const response = await axios.post(fullUrl, { user: usuario, pass: clave });
  
          if (response.data.success) {
            navigation.navigate('Main', { url: url, titulo: selectedHost.nombre });
            await AsyncStorage.setItem('nombre', response.data.nombre);
            guardarDatosUsuario();
          } else {
            Alert.alert('Error', 'No se ha conseguido el usuario');
          }
        } catch (error) {
          alert('Error al intentar conectarse: '+error+' '+ fullUrl);
          Alert.alert('Error de conexión', 'No se pudo conectar al servidor. Por favor, verifica tu conexión a internet y la URL del servidor.');
        } finally {
          isLoading(false);
        }
      } else {
        alert('Ingrese datos válidos');
        isLoading(false);
      }
    } else {
      alert('No ha seleccionado ningún host');
      isLoading(false);
    }
  };
  
  const guardarDatosUsuario = async () => {
    try {
      await AsyncStorage.setItem('datosUsuario', JSON.stringify({ usuario, clave, checked }));
    } catch (error) {
      console.log('Error al guardar los datos del usuario:', error);
    }
  };

  return (
    <Provider>
      <ImageBackground
      source={require('./assets/Fondo-login.gif')} // Asegúrate de tener una imagen en esta ruta
      resizeMode='cover'
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
          <Text style = {{color:'white', fontSize:28, marginBottom:20}}>Bienvenido a</Text>
          <Image
            source={require('./assets/portada.png')} // Asegúrate de tener un logo en esta ruta
            style={styles.logo}
            resizeMode='center'
          />
        <Text style = {{color:'white', fontSize:17, marginBottom:20}}>Ingrese sus credenciales</Text>
        <View style={styles.formContainer}>

          <TextInput
            placeholder='Usuario'
            left = {<TextInput.Icon icon="account" color='rgba(0, 0, 0, 0.5)' />}
            onChangeText = {setUsuario}
            value={usuario}
            style={styles.input}
            theme={{roundness:30}}
            underlineColor='transparent'
            activeUnderlineColor='transparent'
            cursorColor='black'
            textColor='black'
          />

          <TextInput
            placeholder='Clave'
            left = {<TextInput.Icon icon="lock" color='rgba(0, 0, 0, 0.5)'/>}
            onChangeText = {setClave}
            value = {clave}
            secureTextEntry = {!mostrarClave}
            style={styles.input}
            theme={{roundness:30}}
            activeUnderlineColor='transparent'
            underlineColor='transparent'
            cursorColor='black'
            textColor='black'
            right = {<TextInput.Icon icon={mostrarClave ? 'eye-off' : 'eye'} onPress = {() => toggleMostrarClave()} />}
          />

          <View style={styles.checkboxContainer}>
            <Checkbox
              status={checked ? 'checked' : 'unchecked'}
              onPress={() => setChecked(!checked)}
              uncheckedColor='white'
              color='rgba(255,255,255, 0.7)'
            />
            <Text style={styles.checkboxLabel}>Recuérdame</Text>
            <Text style={styles.forgotPassword}>Olvidé mi contraseña</Text>
          </View>

          <View style = {{alignItems:'center', justifyContent:'center'}}>
            <Text style = {{color:'#fff'}}>Conexion: {selectedHost.nombre}</Text>
          </View>
          

          <View style = {{flexDirection: 'column', marginBottom:10, padding: 5}}>
            <Button icon='account-check' mode='elevated' style={{marginBottom:15}} onPress = {() => Login()} compact = {true} textColor = 'black' buttonColor='#b0ffab' >
                Iniciar Sesion
            </Button>
            <Button icon='server-plus' mode='elevated' onPress = {() => navigation.navigate('Hosts')} compact = {true} textColor = 'black' buttonColor='#abd2ff'>
                Conexiones
            </Button>
          </View>
        </View>
      </View>
      <ReactNativeLoadingSpinnerOverlay visible={loading} />
      <StatusBar style="auto" />
    </ImageBackground>
  </Provider>
  );
}

const Header = () => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
      <Image
        style={{ width: 47, height: 47, marginLeft: 15,}}
        source={require('./assets/proteo-ventas.png')}
      />
    </View>
  );
};

const MainScreens = () => {
  return(
    <Stack.Navigator>
      <Stack.Screen name = 'Main' component = {MainScreen} 
          options = {{
            headerShown:false,
            headerStyle:{
              backgroundColor: '#5eccff',
            },
          }} />

      <Stack.Screen name = 'Efectos' component = {EfectosP} 
          options = {{
            headerShown:false,
            headerStyle:{
              backgroundColor: '#5eccff',
            },
          }} />
    </Stack.Navigator>
  )
}

const HistorialScreens = () => {
  return(
    <Hist.Navigator>
      <Hist.Screen name = 'HistorialS' component = {Historial}
      options = {{
        headerShown:false,
        headerStyle:{
          backgroundColor: '#5eccff',
          },
        }} />

      <Hist.Screen name = 'DetalleP' component = {DetallePedido}
      options = {{
        headerShown:false,
        headerStyle:{
          backgroundColor: '#5eccff',
          },
        }} />
    </Hist.Navigator>
  )
}

const InvScreens = () => {
  return(
    <Inv.Navigator>
      <Inv.Screen name = 'InvScreen' component = {Inventario} 
          options = {{
            headerShown:false,
            headerStyle:{
              backgroundColor: '#5eccff',
            },
          }} />

        <Inv.Screen name = 'Pedido' component = {Pedido} 
          options = {{
            headerShown:false,
            headerStyle:{
              backgroundColor: '#5eccff',
            },
          }} />
    </Inv.Navigator>
  )
}

const Maintabs = ({route}) => {
  const {url, titulo} = route.params;

  return (
    <Tab.Navigator
      screenOptions={({navigation}) => ({ 
        headerTitle: titulo,
          headerStyle: {
            backgroundColor:'#f0f5f9',
          },
          headerTitleStyle: {
            fontWeight:'bold',
            fontSize:24,
            fontStyle:'italic',
            color:'#173f5f'
          },
          headerLeft:() => (<Header />),
          headerRight: () => (
            <IconButton
                icon={require('./assets/icons/exit.png')}
                size={28}
                style = {{marginLeft:10}}
                iconColor = '#173f5f'
                onPress={() => {
                    Alert.alert(
                        'Confirmacion',
                        'Desea salir de la aplicacion?',
                        [{ text: 'Cancelar', onPress:  () => console.log('Cancelado'), style: 'cancel'}, {text: 'Ok', 
                        onPress: () => {
                          navigation.navigate('Registro');
                          AsyncStorage.removeItem('datosUsuario');
                      } }]
                    )
                }}
                />
        ),

        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
          borderRadius: 10, // Redondear esquinas
          marginHorizontal: 10, // Espacio a los lados
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          marginBottom: 8
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarActiveTintColor: '#003f71',
        tabBarInactiveTintColor: 'gray'
        

    })}>
      <Tab.Screen
        name="Mains"
        component={MainScreens}
        options={{          
          tabBarLabel: 'Clientes',
          tabBarIcon: ({ color, focused, size }) => (
            <Image
              style = {{ height: 23, width: 35}}
              source= {focused ? require('./assets/icons/group.png') : require('./assets/icons/group-disabled.png')}
            />
          ),
          tabBarHideOnKeyboard: true,
        }}
      />

      
      <Tab.Screen
        name="Inventario"
        component={InvScreens}
        options={{
          tabBarLabel: 'Inventario',
          tabBarIcon: ({ color, focused, size }) => (
            <Image
              style = {{ height: 23, width: 39}}
              source= {focused ? require('./assets/icons/box.png') : require('./assets/icons/box-disabled.png')}
            />
          ),
          tabBarHideOnKeyboard: true,
        }}
      />

      <Tab.Screen
        name="Historial"
        component={HistorialScreens}
        options={{
          tabBarLabel: 'Historial',
          tabBarIcon: ({ color, focused, size }) => (
            <Image
              style = {{ height: 23, width: 39}}
              source= {focused ? require('./assets/icons/history.png') : require('./assets/icons/history-disabled.png')}
            />
          ),
          tabBarHideOnKeyboard: true,
        }}
      />

      <Tab.Screen
        name="Sincronizar"
        options={{
          tabBarLabel: 'Sincronizar',
          tabBarIcon: ({ color, focused, size }) => (
            <Image
              style = {{ height: size, width: size}}
              source= {focused ? require('./assets/icons/sync.png') : require('./assets/icons/sync-disabled.png')}
            />
          ),
          tabBarHideOnKeyboard: true,
        }}
      >
        {() => <Sincronizar url={url} />}

      </Tab.Screen>
    </Tab.Navigator>
  );
};
const PrincipalStack = createNativeStackNavigator();

const Principal = () => {
  return(
      <PaperProvider theme={ligthTheme}>
        <NavigationContainer>
            <PrincipalStack.Navigator>
              <PrincipalStack.Screen name = 'Registro' component = {App} options = {{
                headerShown: false
              }}/>

              <PrincipalStack.Screen name = 'Hosts' component = {Hosts} options = {{}}/>

              <PrincipalStack.Screen name = 'Main' component = {Maintabs} 
              options = {{
                headerShown:false,
              }}/>
            </PrincipalStack.Navigator>
          </NavigationContainer>
      </PaperProvider>
  )
}

export default Principal;

const styles = StyleSheet.create({
  container: {
    //backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',

  },

  formContainer: {
    width: '100%',
  },

  logo: {
    width: 70,
    height: 70,
    width: '100%',
    marginBottom: 20,
    margin:0
  },
  
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxLabel: {
    marginLeft: -50,
    color:'white'
  },

  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  input: {
    marginBottom: 20,
    backgroundColor:'white',
    borderRadius:30,
    height:47,
  },

  forgotPassword: {
    marginRight: 8,
    color:'white'
  },

});
