var id_g;
var pile=new Array();
var ajax_is_loading=false;
var marge_gauche=300;

function routine() {
	if (pile_personnes.length > 0 || ajax_is_loading) {
		if (!ajax_is_loading) {
			var id_to_load=pile_personnes.pop();
			loadPersonne(id_to_load, id_to_caller(id_to_load));
		}
	}
	setTimeout(routine, 500);
}

function loadPersonne (id, id_caller) {
    ajax_is_loading=true;
    id_g=id;

    if ($('boite_'+id)) {
        $('boite_'+id).insert(new Element('img',{'src':'images/ajax-loading.gif'}));
    }
    $('texte_'+id).setStyle({'fontStyle':'italic'});

    new Ajax.Request('Personne.class.php', {
            parameters:script+'=true&site_source='+site_source+'&id_session='+id_session_g+'&serveur='+serveur_g+'&pseudo='+pseudo_g+'&autres_args='+id.replace('%',';pcnt;')+'&caller='+id_caller.replace('%',';pcnt;'),
            asynchronous: true,
            onSuccess: function(transport) {
                var resultat=transport.headerJSON;
                if (!resultat)
                    resultat=eval('('+transport.responseText.substring(transport.responseText.indexOf('{'),transport.responseText.length)+')');
                if (script=='analyse') {
                    if (!resultat || resultat.length==0) {
                        alert('L\'analyse de '+id_g+' a retourn� : \n\n'+transport.responseText);
                        if (nb_barres_ajoutees==0)
                            definir_termine(id_g);
                        ajax_is_loading=false;
                        pile_personnes=new Array();
                        return;
                    }
                    $('texte_'+id_g).setStyle({'fontStyle':'normal'});
                    var niveau_suivant=parseInt($(id_g).readAttribute('name').substring('niveau'.length))+1;
                    var nb_barres_ajoutees=0;
                    if (typeof resultat.pere != 'undefined') {
                        var id_pere=resultat.pere['id'];
                        nb_barres_ajoutees+=ajouter_barre(niveau_suivant,id_pere, id_g,'P�re',resultat.pere['action'],false);
                    }
                    if (typeof resultat.mere != 'undefined') {
                        var id_mere=resultat.mere['id'];
                        nb_barres_ajoutees+=ajouter_barre(niveau_suivant,id_mere, id_g,'M�re',resultat.mere['action'],false);
                    }
                    if (typeof resultat.mariages != 'undefined') {
                        for(var i=0;i<resultat.mariages.length;i++) {
                            var id_conjoint=resultat.mariages[i]['conjoint']['id'];
                            nb_barres_ajoutees+=ajouter_barre(niveau_suivant,id_conjoint, id_g,'Epoux',resultat.mariages[i]['conjoint']['action'],false);
                            if (typeof resultat.mariages[i].enfants != 'undefined') {
                                for (var j in resultat.mariages[i]['enfants']) {
                                    if (isNaN(j))
                                        continue;
                                    var id_enfant=resultat.mariages[i]['enfants'][j]['id'];
                                    nb_barres_ajoutees+=ajouter_barre(niveau_suivant,id_enfant, id_g,'Enfant',resultat.mariages[i]['enfants'][j]['action'],id_conjoint);
                                }
                            }
                        }
                    }
                    if (resultat.traits) {
                        for (var i=0;i<resultat.traits.length;i++) {
                            if ($(trait_to_id(resultat.traits[i])))
                                $(trait_to_id(resultat.traits[i])).remove();
                            afficher_trait(resultat.traits[i]);
                        }
                    }
                    if (resultat.boites) {
                        for (var i=0;i<resultat.boites.length;i++) {
                            if ($('boite_'+resultat.boites[i].id))
                                $('boite_'+resultat.boites[i].id).remove();
                            afficher_boite(resultat.boites[i]);
                        }
                    }
                    $$('.personne, .trait').each (function(el) {
                        el.style.marginTop = resultat.decalage.top + "px";
                        el.style.marginLeft = marge_gauche+resultat.decalage.left + "px";
                    });
                    if (nb_barres_ajoutees==0)
                        definir_termine(id_g);
                }
                else if (script=='make_tree') {
                    if (!resultat || resultat.length==0) {
                        alert('L\'analyse de '+id_g+' a retourn� : \n\n'+transport.responseText);
                        ajax_is_loading=false;
                        pile_personnes=new Array();
                        return;
                    }
                    afficher_boite(resultat.boites.creation[0]);
                }
                ajax_is_loading=false;
            }
    });
}

function trait_to_id(trait) {
	var id=trait.id+'~'+trait.id2;
	if (trait.id3)
		id+='~'+trait.id3;
        id+='~~'+trait.name;
	return id;
}

function afficher_trait(trait) {
	var eltrait=new Element('div',{'id':trait_to_id(trait), 'name':trait.name})
						.addClassName('trait')
						.setStyle({'left':trait.pos_debut.x+'px','top':trait.pos_debut.y+'px'});
	$('body').insert(eltrait);
	for (var borderpos in trait['border']) {
		if (trait.border[borderpos]!=null && trait.border[borderpos]!=0 )
		eltrait.addClassName(borderpos);
	}
	if (trait.width)
		eltrait.setStyle({'width':trait.width+'px'});
	if (trait.height)
		eltrait.setStyle({'height':trait.height+'px'});
	if (trait.label)
		eltrait.update(new Element('span').setStyle({'position':'relative','top':'-3px'}).update(trait.label));
	else
		eltrait.update('&nbsp;');
}

function afficher_boite(boite) {
	var elboite=new Element('div',{'id':'boite_'+boite.id}).addClassName('personne '+boite.sexe)
                                                               .setStyle({'left':boite.pos.x+'px','top':boite.pos.y+'px',
                                                                          'width':boite.dimension.width+'px','height':boite.dimension.height+'px'})
                                                               .update(boite.contenu);
	$('body').insert(elboite);
}

function definir_termine(id) {
	$(id).replace('OK');

	var id_caller=id_to_caller(id);
	if (!$(id_caller) || $(id_caller)=='')
		return;
	var nb_enfants_caller=pile[id_caller]?pile[id_caller].length:1;
	myJsProgressBarHandler.setPercentage(id_caller,'+'+(100/nb_enfants_caller));
	if (myJsProgressBarHandler.getPercentage(id_caller)>99)
		definir_termine(id_caller);

	return;
}

function id_to_caller(id) {
	var callers=new Array();
	for (var caller in pile)
		for (var i=0;i<pile[caller].length;i++)
			if (pile[caller][i]==id)
				callers.push(caller);
	return callers.length==0?'':(callers.length==1?callers[0]:callers);
}

function ajouter_barre(niveau, id, id_caller,type, etat, id_conjoint) {
	if ($(id))
            return 0;
        var texte=id;
	if (id_to_caller(id)!='')
		etat='already_done';
	
	if (etat!='todo') {
		if (etat=='already_done')
                    texte+=' [<a href="#texte_'+id+'>cf ici</a>]';
                else
                    texte+=' ['+etat+']';
		var numero=1;
		while ($(id+numero))
			numero++;
		id+='/'+numero;
	}
	if (type=='Enfant')
		niveau++;
	texte=type+' : '+texte;
	var couleur="#000000";
	var num_image='';
	switch(type) {
		case 'Enfant':couleur='#04B404';num_image=1;break;
		case 'P�re':couleur='#0101DF';num_image=2;break;
		case 'M�re':couleur='#FF0000';num_image=3;break;
		case 'Epoux':couleur='#9A2EFE';num_image=4;break;
	}
	var progressBar=new Element('span',{'id':'texte_'+id,'name':id}).setStyle({'color':couleur,'fontWeight':'bold'}).update(texte);
	var espacement='';
	for (var a=0;a<niveau;a++)
		espacement+='&nbsp;&nbsp;';
	$(id_caller).insert(progressBar);
	$(progressBar).insert({'before':new Element('br')});
	$(progressBar).insert({'before':espacement});

	if (etat=='todo') {
		var progressBarTexte=new Element('span',{'id':id, 'name':'niveau'+niveau}).addClassName('progressBar');
		$(progressBar).insert({'after':progressBarTexte}).insert({'after':new Element('br')});
		$(progressBarTexte).insert({'before':espacement});
		new JS_BRAMUS.jsProgressBar($(id), 0);
		JS_BRAMUS.jsProgressBarHandler.prototype.pbArray[id]	= new JS_BRAMUS.jsProgressBar($(id), parseInt($(id).innerHTML.replace("%","")), {animate: false, width: 120, height: 12, barImage: 'images/bramus/percentImage_back'+num_image+'.png'}); 
		if (typeof pile[id_caller] == 'undefined') {
			pile[id_caller]=new Array();
		}
		pile[id_caller].push(id);
		pile_personnes.push(id);
		return 1;
	}
	return 0;
}