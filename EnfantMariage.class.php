<?php
include_once('ComplexObject.class.php');

class EnfantMariage extends ComplexObject {
	var $id_mariage;
	var $id_enfant;
        var $numero;
	static $identifiants=array('id_mariage','id_enfant');
}

?>