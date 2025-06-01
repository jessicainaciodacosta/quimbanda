(function ($) {
  "use strict";

  // --- Cache de Seletores Globais ---
  const $window = $(window);
  const $document = $(document);
  const $body = $('body');
  const $header = $('#header');
  const $backToTop = $('.back-to-top');
  let $sectionsToReveal = $('.section-hidden'); // Será atualizado dinamicamente
  const $navSections = $('section[id]'); // Seções com ID para o menu de navegação
  const $mainNav = $('.nav-menu, #mobile-nav');

  // --- Debounce Function ---
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  // --- Efeitos de Scroll ---
  function handleScrollEffects() {
    const scrollY = $window.scrollTop();
    const scrollThreshold = 50;

    // 1. Visibilidade e estilo do Header
    if ($header.length) {
      if (scrollY > scrollThreshold) {
        $header.addClass('scroll-header');
      } else {
        $header.removeClass('scroll-header');
      }
    }

    // 2. Escurecimento do overlay da Intro
    const introElement = document.getElementById('intro'); // Vanilla JS para setProperty
    if (introElement) {
      const maxOpacity = 0.6; // Ajuste conforme preferência (0.0 a 1.0)
      const newOpacity = Math.min(scrollY / (window.innerHeight * 0.6), maxOpacity); // Ajuste o divisor para a "velocidade" do escurecimento
      introElement.style.setProperty('--overlay-opacity', newOpacity);
    }

    // 3. Revelar Seções (otimizado)
    if ($sectionsToReveal.length) {
      const windowHeight = $window.height();
      $sectionsToReveal = $sectionsToReveal.filter(function() { // Usar .filter() para remover da coleção jQuery
        const $section = $(this);
        // Revelar se a seção está parcialmente visível ou se o scroll passou de um threshold básico
        if ($section.offset().top < scrollY + windowHeight - 100 || scrollY > scrollThreshold + 50) { // -100 para revelar um pouco antes de estar totalmente na tela
          $section.addClass('section-visible').removeClass('section-hidden');
          return false; // Remove da coleção $sectionsToReveal para não processar novamente
        }
        return true; // Mantém na coleção para verificação futura
      });
    }
  }

  // --- Estado Ativo da Navegação (Otimizado) ---
  let sectionData = []; // Armazena dados das seções (id, top, bottom)

  function calculateSectionOffsets() {
    sectionData = []; // Reset
    const headerHeight = $header.length ? $header.outerHeight() : 0;
    $navSections.each(function() {
      const $section = $(this);
      const sectionId = $section.attr('id');
      if (sectionId) { // Garante que a seção tem um ID
        sectionData.push({
          id: sectionId,
          top: $section.offset().top - headerHeight - 20, // Ajuste de -20px para ativar um pouco antes
          bottom: $section.offset().top + $section.outerHeight() - headerHeight - 20,
        });
      }
    });
  }

  function updateNavActiveState() {
    const scrollY = $window.scrollTop();
    let currentSectionId = null;

    // Lógica para o link "Home" (#intro)
    // Se o scroll está acima do ponto de ativação da primeira seção real (ex: #about)
    const firstRealSectionActivationPoint = sectionData.length > 0 ? sectionData[0].top : ($window.height() * 0.5);
     if (sectionData.length > 0 && $navSections.first().attr('id') !== 'intro' && $window.scrollTop() < ($navSections.first().offset().top - ($header.outerHeight() || 0) - 20)) {
        currentSectionId = 'intro';
    } else if (sectionData.length === 0 && scrollY < ($window.height() * 0.5) ) { // Caso não haja seções além da intro
        currentSectionId = 'intro';
    }


    if (!currentSectionId) { // Se não for 'intro', verifica outras seções
        for (let i = 0; i < sectionData.length; i++) {
          if (scrollY >= sectionData[i].top && scrollY < sectionData[i].bottom) {
            currentSectionId = sectionData[i].id;
            break;
          }
        }
        // Se passou da última seção, mantém a última ativa
        if (!currentSectionId && sectionData.length > 0 && scrollY >= sectionData[sectionData.length - 1].top) {
            currentSectionId = sectionData[sectionData.length - 1].id;
        }
    }
    
    $mainNav.find('li').removeClass('menu-active');
    if (currentSectionId) {
      $mainNav.find('a[href="#' + currentSectionId + '"]').parent('li').addClass('menu-active');
    } else if (scrollY < ($window.height() * 0.3)) { // Fallback para 'intro' se muito no topo e nada mais ativo
        $mainNav.find('a[href="#intro"]').parent('li').addClass('menu-active');
    }
  }

  // --- Inicialização das Funcionalidades ---
  function initBackToTop() {
    $window.scroll(function() {
      if ($(this).scrollTop() > 100) {
        $backToTop.fadeIn('slow');
      } else {
        $backToTop.fadeOut('slow');
      }
    });
    $backToTop.click(function(e){
      e.preventDefault();
      $('html, body').animate({scrollTop : 0}, 800, 'easeInOutExpo'); // jQuery Easing plugin para 'easeInOutExpo'
    });
  }

  function initMobileNav() {
    if ($('#nav-menu-container').length) {
      const $mobileNavContainer = $('#nav-menu-container').clone().prop({ id: 'mobile-nav' });
      $mobileNavContainer.find('> ul').attr({ 'class': '', 'id': '' }); // Limpa classes e IDs do ul clonado
      $body.append($mobileNavContainer);
      $body.prepend('<button type="button" id="mobile-nav-toggle"><i class="fa fa-bars"></i></button>');
      $body.append('<div id="mobile-body-overly"></div>'); // Overlay
      $('#mobile-nav').find('.menu-has-children').prepend('<i class="fa fa-chevron-down"></i>'); // Ícone para submenus

      // Eventos para o menu mobile
      $document.on('click', '.menu-has-children i', function(e) {
        $(this).next().toggleClass('menu-item-active'); // Ativa o item do submenu
        $(this).nextAll('ul').eq(0).slideToggle(); // Mostra/esconde submenu
        $(this).toggleClass("fa-chevron-up fa-chevron-down"); // Troca o ícone
      });

      $document.on('click', '#mobile-nav-toggle', function(e) {
        $body.toggleClass('mobile-nav-active'); // Ativa/desativa estado do menu mobile no body
        $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars'); // Troca ícone do botão (hambúrguer/X)
        $('#mobile-body-overly').toggle(); // Mostra/esconde overlay
      });

      // Fecha o menu mobile se clicar fora dele
      $document.on('click', function(e) {
        const container = $("#mobile-nav, #mobile-nav-toggle");
        if (!container.is(e.target) && container.has(e.target).length === 0) { // Se o clique não foi no menu nem no botão
          if ($body.hasClass('mobile-nav-active')) {
            $body.removeClass('mobile-nav-active');
            $('#mobile-nav-toggle i').removeClass('fa-times').addClass('fa-bars');
            $('#mobile-body-overly').fadeOut();
          }
        }
      });
    } else if ($("#mobile-nav, #mobile-nav-toggle").length) {
      // Esconde se o container principal do menu não existir (caso raro)
      $("#mobile-nav, #mobile-nav-toggle").hide();
    }
  }

  function initSmoothScroll() {
    // Seletor para todos os links de navegação (desktop, mobile, e outros com .scrollto)
    $('.nav-menu a, #mobile-nav a, .scrollto').on('click', function(e) {
      if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
        const target = $(this.hash); // O elemento alvo (ex: <section id="about">)
        if (target.length) {
          e.preventDefault(); // Previne o comportamento padrão do link
          let top_space = 0;
          if ($header.length && $header.css('position') === 'fixed') { // Considera a altura do header fixo
            top_space = $header.outerHeight();
          }
          $('html, body').animate({
            scrollTop: target.offset().top - top_space
          }, 800, 'easeInOutExpo');

          // Atualiza classe 'menu-active' e fecha menu mobile
          if ($(this).parents('.nav-menu').length) {
            $('.nav-menu .menu-active').removeClass('menu-active');
            $(this).closest('li').addClass('menu-active');
          }
          if ($body.hasClass('mobile-nav-active')) {
            $body.removeClass('mobile-nav-active');
            $('#mobile-nav-toggle i').removeClass('fa-times').addClass('fa-bars');
            $('#mobile-body-overly').fadeOut();
          }
        }
      }
    });
  }

  // --- Execução e Event Listeners ---
  $window.on('load', function() {
    calculateSectionOffsets(); // Calcular offsets após tudo carregado (imagens etc)
    handleScrollEffects();    // Aplicar efeitos iniciais (ex: se a página carregar já rolada)
    updateNavActiveState();   // Definir estado inicial do menu
  });

  // Usar um único listener de scroll debounced para múltiplas funções
  const debouncedScrollHandler = debounce(function() {
    handleScrollEffects();
    updateNavActiveState();
  }, 15); // 15ms é um bom valor para responsividade sem sobrecarregar
  $window.on('scroll', debouncedScrollHandler);

  // Recalcular offsets das seções em resize da janela
  const debouncedResizeHandler = debounce(function() {
    calculateSectionOffsets();
    updateNavActiveState(); // Também atualiza o nav para o caso de a seção ativa mudar com o resize
  }, 200);
  $window.on('resize', debouncedResizeHandler);

  // Inicializar componentes que não dependem primariamente de scroll/resize para sua configuração inicial
  initBackToTop();
  initMobileNav();
  initSmoothScroll();

})(jQuery);