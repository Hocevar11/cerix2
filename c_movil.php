<?php 
defined('BASEPATH') OR exit('No direct script access allowed');

class C_movil extends Controller {

    //Funcion que maneja el Login a la aplicacion 
    public function login(){
        $datos = json_decode(file_get_contents('php://input'), true);

        $mSQL  = 'SELECT id FROM usuario WHERE us_codigo ="'.$datos['user'].'" AND us_clave ="'.$datos['pass'].'"';
        $query = $this->db->query($mSQL);

        if($query->num_rows() > 0) {
            $nombre = $this->datasis->dameval('SELECT us_nombre FROM usuario WHERE us_codigo ="'.$datos['user'].'" AND us_clave ="'.$datos['pass'].'"');

            echo json_encode(array('success'=> true,  'mensaje' => 'Inicio de Sesion Correcto', 'nombre' => $nombre));
        }else{
            echo json_encode(array('success'=> false, 'mensaje' => 'Datos Invalidos'));
        }

    }

    public function probar() {
        echo json_encode(array('success' => true, 'mensaje' => 'Conexion establecida'));
    }
    
    public function clientes(){
        header('Content-Type: application/json');

        $mSQL = 'SELECT id, cliente, IF(nomfis IS NULL, nombre, nomfis) nombre, 
        grupo, limite, formap dialimi, CONCAT(dire11, " ", dire12) dire, ciudad1, telefono, email, rifci, 
        (SELECT COUNT(*) FROM sfac WHERE cod_cli = a.cliente AND tipo_doc = "F" AND fecha >= DATE_SUB(NOW(), INTERVAL 1 MONTH)) facts,
        (SELECT COUNT(*) FROM sfac WHERE cod_cli = a.cliente AND tipo_doc = "D" AND fecha >= DATE_SUB(NOW(), INTERVAL 1 MONTH)) devo,
        (SELECT  COALESCE(ROUND(SUM(abonos-monto),2),0) FROM smov a WHERE a.cod_cli = a.cliente AND a.tipo_doc IN ("ND","FC") AND a.abonos < a.monto) vencido
        FROM scli a 
        WHERE tipo = 1 ';

        $query = $this->db->query($mSQL);
        $clientes = $query->result_array();

        $this->output->set_output(json_encode($clientes, JSON_UNESCAPED_UNICODE));

    }

    public function efectosP($cliente){
        header('Content-Type: application/json');

        $mSQL = "SELECT a.fecha, a.numero, a.vence AS fvence, a.tipo_doc, DATEDIFF(a.vence, CURDATE()) vence, a.id,
        a.monto, a.montod, a.abonos, a.abonosd, a.observa1
        FROM smov a
        WHERE a.tipo_doc IN ('ND', 'FC') AND a.abonos <> a.monto AND a.cod_cli = '".$cliente."'";

        $query = $this->db->query($mSQL);
        $facturas = $query->result_array();

        $this->output->set_output(json_encode($facturas, JSON_UNESCAPED_UNICODE));
    }

    public function ventasGrafico($cliente){
        header('Content-Type: application/json');

        $mSQL = "SELECT SUM(a.monto) monto, SUM(a.montod) montod, m.nombre AS mes, YEAR(a.fecha) anio, CONCAT(YEAR(a.fecha),' ', m.nombre) fecha
        FROM smov a
        JOIN
          (
            SELECT 1 AS numero, 'Ene' AS nombre
            UNION ALL
            SELECT 2 AS numero, 'Feb' AS nombre
            UNION ALL
            SELECT 3 AS numero, 'Mar' AS nombre
            UNION ALL
            SELECT 4 AS numero, 'Abr' AS nombre
            UNION ALL
            SELECT 5 AS numero, 'May' AS nombre
            UNION ALL
            SELECT 6 AS numero, 'Jun' AS nombre
            UNION ALL
            SELECT 7 AS numero, 'Jul' AS nombre
            UNION ALL
            SELECT 8 AS numero, 'Ago' AS nombre
            UNION ALL
            SELECT 9 AS numero, 'Sep' AS nombre
            UNION ALL
            SELECT 10 AS numero, 'Oct' AS nombre
            UNION ALL
            SELECT 11 AS numero, 'Nov' AS nombre
            UNION ALL
            SELECT 12 AS numero, 'Dic' AS nombre
          ) m ON MONTH(a.fecha) = m.numero
        WHERE a.cod_cli = '".$cliente."' AND a.fecha >= DATE_SUB(NOW(), INTERVAL 3 MONTH) AND a.tipo_doc IN('ND','FC')
        GROUP BY anio, mes
        ORDER BY MONTH(a.fecha)";

        $query = $this->db->query($mSQL);
        $facturas = $query->result_array();

        $this->output->set_output(json_encode($facturas, JSON_UNESCAPED_UNICODE));

    }

    public function recibePedido(){
        if($_SERVER['REQUEST_METHOD'] === 'POST'){
            $data = json_decode(file_get_contents('php://input'), true);
            $cliente = $data['cliente'];
            $usuario = $data['user'];
            $mensaje='';
            $er=0;
            if(isset($data['p']) && !empty($data['p'])){
                $fecha = date('Y-m-d');
                $estampa   = date('Y-m-d H:i:s');

                foreach ($data['p'] as $producto) {
                    $codigo = $producto['codigo'];
                    $cantidad = $producto['cana'];
                    $descrip = $producto['descrip'];

                    $itsinv = $this->db->query("SELECT a.* FROM itsinv a WHERE codigo='$codigo' AND alma='0001'")->row();

                    //Valida la existencia de los productos
                    if ($cantidad>$itsinv->existen) {
                        $existen = intval($itsinv->existen);
                        $er++;
                        $mensaje .= " Producto: $descrip, Cantidad existente: $existen";   
                    }else{
                        if($er==0){
                            $data = array(
                                'fecha'    => $fecha,
                                'cliente'  => $cliente,
                                'codigo'   => $codigo,
                                'cantidad' => $cantidad,
                                'usuario' => $usuario, 
                                'origen'   => 'APP',
                                'estampa'  => $estampa
                            );
                            $this->db->insert('impedido', $data);
                        }
                    }
                }
    
                if ($er>0) {
                    echo json_encode(['estatus' => 'Cantidad mayor a existencia' . $mensaje]);
                } else {
                    echo json_encode(['estatus' => 'Pedido enviado']);
                }
            }else{
                echo json_encode(['estatus' => 'Error al enviar el pedido']);
            }
        }else{
            http_response_code(405);
            echo json_encode(['estatus' => 'Metodo no permitido']);
        }
    } 
 

    public function historial(){
        header('Content-Type: application/json');

        $datos = json_decode(file_get_contents('php://input'), true);
        $fdesde     = date('Y-m-d', strtotime(str_replace('/', '-', $datos['fdesde'])));
        $fhasta     = date('Y-m-d', strtotime(str_replace('/', '-', $datos['fhasta'])));
        $usuario    = $datos['user'];
        $data       = array();

        if(isset($fdesde) && isset($fhasta)){
            $mSQL = "SELECT a.cliente,b.nombre,SUM(a.cantidad) cantidad,c.numero AS pedido,
            a.fecha,a.usuario, c.totals, c.iva, c.totalg, c.id, c.factura
            FROM impedido a 
            JOIN scli b ON a.cliente = b.cliente
            JOIN pfac c ON a.pedido=c.numero
            WHERE a.fecha>='${fdesde}' AND a.fecha <='${fhasta}' AND c.usuario = '${usuario}'
            GROUP BY c.numero";

            $query = $this->db->query($mSQL);
            if ($query->num_rows() > 0) {
                foreach ($query->result() as $row){
                    $data2 = array(
                        'pedido'   => $row->pedido,
                        'cliente'  => $row->cliente,
                        'nombre'   => $row->nombre,
                        'fecha'    => $row->fecha,
                        'cantidad' => $row->cantidad,
                        'id'       => $row->id,
                        'totals'   => $row->totals,
                        'iva'      => $row->iva,
                        'totalg'   => $row->totalg,
                        'factura'  => $row->factura

                    );
                    array_push($data, $data2);
                }
            }

            //echo json_encode($usuario);
            $this->output->set_output(json_encode($data, JSON_INVALID_UTF8_SUBSTITUTE));
        }
    }

    public function detallePedido() {
        header('Content-Type: application/json');
    
        $datos = json_decode(file_get_contents('php://input'), true);
        $idpedido = $this->db->escape($datos['pedido']);
        $data = array();

        if ($idpedido) {
            $mSQL = "SELECT b.numa,b.codigoa,b.desca,(b.cana+b.bonifica) cana,b.preca,b.tota,b.iva,b.id
            FROM pfac a 
            JOIN itpfac b ON a.numero=b.numa
            WHERE a.id=${idpedido}";
            
            $query = $this->db->query($mSQL);
            if ($query->num_rows() > 0) {
                foreach ($query->result() as $row){
                    $data2 = array(
                        'id'       => $row->id,
                        'pedido'   => $row->numa,
                        'codigo'   => $row->codigoa,
                        'descrip'  => $row->desca,
                        'cana'     => $row->cana,
                        'preca'    => $row->preca,
                        'tota'     => $row->tota,
                        'iva'      => $row->iva

                    );
                    array_push($data, $data2);
                }
            }
            $this->output->set_output(json_encode($data, JSON_INVALID_UTF8_SUBSTITUTE));
        } else {
            $this->output->set_output(json_encode(['error' => 'Pedido no especificado'], JSON_INVALID_UTF8_SUBSTITUTE));
        }
    
    } 
    
    public function inventario(){
        $this->load->library('path');
    
        $path=new Path();
        $path->setPath($this->config->item('uploads_dir'));
        $path->append('/inventario');
        $this->upload_path =$path->getPath().'/Image/';
    
        header('Content-Type: application/json');
    
        $url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off' || $_SERVER['SERVER_PORT'] == 443) ? 'https://' : 'http://';
        $url .= $_SERVER['HTTP_HOST'];
    
        $mSQL = 'SELECT a.codigo, descrip, tipo, prov1, precio1, precio2, precio3, precio4, preciod1, preciod2, preciod3, preciod4, marca, iva, b.existen,
            CEIL((ROW_NUMBER() OVER (ORDER BY descrip)) / 25) AS pagina
            FROM sinv a
            JOIN itsinv b ON a.codigo = b.codigo
            WHERE a.activo = "S" AND b.existen > 0 AND b.alma = "0001" AND precio1 IS NOT NULL
            ORDER BY descrip';
    
        $query = $this->db->query($mSQL);
        $inventario = $query->result_array();
    
        foreach($inventario as &$row){
            $image_path = $_SERVER['DOCUMENT_ROOT'].$this->upload_path.$row['codigo'].'_.png';

            if (file_exists($image_path)) {
                $row['imagen_url'] = $url.$this->upload_path.$row['codigo'].'_.png';
            } else {
                // Si el archivo no existe, establece una imagen por defecto
                $row['imagen_url'] = '';
            }
        }
    
        $this->output->set_output(json_encode($inventario, JSON_UNESCAPED_UNICODE));
    }
    
    
    
}

?>