<?php
include_once('ComplexObject.class.php');
class Mariage extends ComplexObject{
	var $id;
	var $conjoint1;
	var $conjoint2;
	var $date_mariage;
	var $lieu_mariage;
	var $enfants=array();
	static $identifiants=array('id');
	static $traitement_special=array('enfants');
	
	function get($filtres, $str_all) {
            $o=parent::get($filtres,$str_all);
            if (!is_null($o)) {
                if (!is_array($o))
                    $o=array($o);
                foreach($o as $i=>$objet) {
                    $o[$i]->enfants=array();
                    $enfants_mariage = ComplexObjectToGet('EnfantMariage',array('id_mariage'=>$o[$i]->id),'all');
                    if (!is_null($enfants_mariage)) {
                        if (!is_null($enfants_mariage)) {
                            foreach($enfants_mariage as $j=>$enfant_mariage) {
                                $o[$i]->enfants[$enfant_mariage->numero]=$enfant_mariage->id_enfant;
                            }
                        }
                    }
                }
            }
            return $str_all==='all'?$o : $o[0];
	}

        function addOrUpdate() {
            if ($this->exists(array('conjoint1'=>$this->conjoint1,'conjoint2'=>$this->conjoint2))) {
                $this->update();
            }
            else {
                $this->add();
            }
	}

	function add() {
            $this->id=$this->getNext('id');
            $this->addEnfants($this->enfants);
            parent::add();
	}
	
	function update() {
            parent::update();
            $this->id=ComplexObjectFieldToGet('Mariage', 'id', array('conjoint1'=>$this->conjoint1,'conjoint2'=>$this->conjoint2));
            $this->updateEnfants($this->enfants);
	}

        function exists($filtres=array()) {
            $filtres2=$filtres;
            if (array_key_exists('conjoint1',$filtres)) {
                if (array_key_exists('conjoint2',$filtres)) {
                    $existe1=parent::exists($filtres);
                    $filtres['conjoint1']=$filtres2['conjoint2'];
                    $filtres['conjoint2']=$filtres2['conjoint1'];
                    $existe2=parent::exists($filtres);
                    return $existe1 || $existe2;
                }
                else {
                    $existe1=parent::exists($filtres);
                    $filtres['conjoint2']=$filtres['conjoint1'];
                    unset($filtres['conjoint1']);
                    $existe2=parent::exists($filtres);
                    return $existe1 || $existe2;
                }
            } 
            else {
                if (array_key_exists('conjoint2',$filtres)) {
                    $existe1=parent::exists($filtres);
                    $filtres['conjoint1']=$filtres['conjoint2'];
                    unset($filtres['conjoint2']);
                    $existe2=parent::exists($filtres);
                    return $existe1 || $existe2;
                }
                else
                    return parent::exists($filtres);
            }
        }

	function addEnfants(array $enfants) {
            foreach($enfants as $i=>$id_enfant) {
                $enfantmariage=new EnfantMariage(array('id_enfant'=>$id_enfant,'id_mariage'=>$this->id, 'numero'=>$i));
                $enfantmariage->add();
            }
	}

        function updateEnfants(array $enfants) {
            foreach($enfants as $i=>$id_enfant) {
                $enfantmariage=new EnfantMariage(array('id_enfant'=>$id_enfant,'id_mariage'=>$this->id, 'numero'=>$i));
                $enfantmariage->addOrUpdate();
            }
	}
	
	function detecter_non_references() {
		$texte='';
		$personnes_a_scanner=array($this->conjoint1,$this->conjoint2);
		$personnes_non_referencees=array();
		foreach ($this->enfants as $enfant) {
			array_push($personnes_a_scanner,$enfant);
		}
		foreach ($personnes_a_scanner as $id_personne) {
			if (false===array_search($id_personne,Personne::$personnes_ecrites)
			&&  false===array_search($id_personne,Personne::$personnes_en_cours)) {
				$personne=Personne::$liste[$id_personne];
				array_push($personnes_non_referencees,array('numero'=>$personne->get_numero_personne(),
														   'numero_famille_origine'=>$personne->get_numero_famille_origine(),
														   'numeros_familles_souches'=>$personne->get_numeros_familles_souches()));
			}
		}
		return $personnes_non_referencees;
	}
	
	static function getMariageConcerne ($liste_mariages, $id_enfant) {
            foreach($liste_mariages as $num_mariage=>$mariage) {
                $enfants_mariage=ComplexObjectToGet('EnfantMariage', array('id_mariage'=>$mariage->id),'all');
                if (is_null($enfants_mariage))
                    continue;
                foreach($enfants_mariage as $enfant_mariage) {
                    if ($id_enfant==$enfant_mariage->id_enfant)
                        return $num_mariage;
                }
            }
            return null;
        }

        function getNumeroEnfantFratrie ($id_enfant) {
            $enfants_mariage=ComplexObjectToGet('EnfantMariage', array('id_mariage'=>$this->id),'all');
            foreach ($enfants_mariage as $enfant_mariage) {
                if ($id_enfant==$enfant_mariage->id_enfant)
                    return $enfant_mariage->numero;
            }
            return null;
	}

        function getPremierDernierEnfant() {
            require_once('Boite.class.php');
            foreach($this->enfants as $id_enfant) {
                $boite_enfant=ComplexObjectToGet('Boite',array('id'=>$id_enfant));
                $boites_enfants[]=$boite_enfant;
            }
            trier($boites_enfants,'pos->x');
            $boite_premier_enfant=$boites_enfants[0];
            $boite_dernier_enfant=$boites_enfants[count($boites_enfants)-1];

            return array($boite_premier_enfant,$boite_dernier_enfant);
        }
}?>