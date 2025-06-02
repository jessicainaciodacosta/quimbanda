(function ($) {
  "use strict";

  // --- Cache de Seletores Globais ---
  const $window = $(window);
  const $document = $(document);
  const $body = $('body');
  const $header = $('#header');
  const $backToTop = $('.back-to-top');
  let $sectionsToReveal = $('.section-hidden'); 
  const $navSections = $('section[id]'); 
  const $mainNav = $('.nav-menu, #mobile-nav');
  
  const $introElements = $('#intro .intro-element'); // Cache dos elementos da intro
  let introElementsRevealed = false; // Flag para controlar a revelação dos elementos da intro
  let pageScrolled = false; // Flag para verificar se o usuário já rolou a página alguma vez

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

  // --- (Função animateIntroElements FOI REMOVIDA) ---

  // --- Efeitos de Scroll ---
  function handleScrollEffects() {
    const scrollY = $window.scrollTop();
    
    if (scrollY > 0 && !pageScrolled) { // Detecta o primeiro scroll
        pageScrolled = true;
    }

    const headerRevealThreshold = 50; 

    // 1. Visibilidade e estilo do Header
    if ($header.length) {
      // Revela o header se a página foi rolada ou se o scroll passou do threshold
      if (pageScrolled || scrollY > headerRevealThreshold) { 
        if (!$header.hasClass('scroll-header')) {
          $header.addClass('scroll-header');
        }
      } else {
        if ($header.hasClass('scroll-header')) {
          $header.removeClass('scroll-header');
        }
      }
    }

    // 2. Revelar elementos da Intro APÓS o primeiro scroll
    if (pageScrolled && !introElementsRevealed) {
      $introElements.removeClass('intro-element-hidden');
      introElementsRevealed = true; 
    }

    // 3. Escurecimento do overlay da Intro (lógica mantida)
    const introElement = document.getElementById('intro');
    if (introElement) {
      const maxOverlayOpacity = 0.6;
      const maxScrollForOverlay = window.innerHeight * 0.8;
      let newOverlayOpacity = 0;
      if (scrollY > 0) {
          newOverlayOpacity = Math.min(scrollY / maxScrollForOverlay, maxOverlayOpacity);
      }
      introElement.style.setProperty('--overlay-opacity', newOverlayOpacity);
    }

    // 4. Revelar Seções (lógica mantida)
    if ($sectionsToReveal.length) {
      const windowHeight = $window.height();
      $sectionsToReveal = $sectionsToReveal.filter(function() {
        const $section = $(this);
        if ($section.offset().top < scrollY + windowHeight - 100) {
          $section.addClass('section-visible').removeClass('section-hidden');
          return false; 
        }
        return true; 
      });
    }
  }

  // --- Estado Ativo da Navegação (Otimizado) ---
  // (Suas funções calculateSectionOffsets e updateNavActiveState devem ser mantidas como estavam)
  let sectionData = []; 

  function calculateSectionOffsets() {
    sectionData = []; 
    const headerHeight = $header.length ? $header.outerHeight() : 0;
    // Adiciona uma verificação para $navSections.length para evitar erros se não houver seções de navegação
    if ($navSections.length > 0) {
        $navSections.each(function() {
          const $section = $(this);
          const sectionId = $section.attr('id');
          if (sectionId) { 
            sectionData.push({
              id: sectionId,
              top: $section.offset().top - headerHeight - 20,
              bottom: $section.offset().top + $section.outerHeight() - headerHeight - 20,
            });
          }
        });
    }
  }

  function updateNavActiveState() {
    const scrollY = $window.scrollTop();
    let currentSectionId = null;

    if (sectionData.length > 0 && scrollY < sectionData[0].top + 50) { 
        currentSectionId = 'intro';
    } else {
        for (let i = 0; i < sectionData.length; i++) {
          if (scrollY >= sectionData[i].top && scrollY < sectionData[i].bottom) {
            currentSectionId = sectionData[i].id;
            break;
          }
        }
        if (!currentSectionId && sectionData.length > 0 && scrollY >= sectionData[sectionData.length - 1].top) {
            currentSectionId = sectionData[sectionData.length - 1].id;
        }
    }
    
    $mainNav.find('li').removeClass('menu-active');
    if (currentSectionId) {
      $mainNav.find('a[href="#' + currentSectionId + '"]').parent('li').addClass('menu-active');
    }
  }

  // --- Inicialização das Funcionalidades ---
  // (Suas funções initBackToTop, initMobileNav, initSmoothScroll devem ser mantidas como estavam)
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
      $('html, body').animate({scrollTop : 0}, 800, 'easeInOutExpo'); 
    });
  }

  function initMobileNav() {
    if ($('#nav-menu-container').length) {
      const $mobileNavContainer = $('#nav-menu-container').clone().prop({ id: 'mobile-nav' });
      $mobileNavContainer.find('> ul').attr({ 'class': '', 'id': '' }); 
      $body.append($mobileNavContainer);
      $body.prepend('<button type="button" id="mobile-nav-toggle"><i class="fa fa-bars"></i></button>');
      $body.append('<div id="mobile-body-overly"></div>'); 
      $('#mobile-nav').find('.menu-has-children').prepend('<i class="fa fa-chevron-down"></i>'); 

      $document.on('click', '.menu-has-children i', function(e) {
        $(this).next().toggleClass('menu-item-active'); 
        $(this).nextAll('ul').eq(0).slideToggle(); 
        $(this).toggleClass("fa-chevron-up fa-chevron-down"); 
      });

      $document.on('click', '#mobile-nav-toggle', function(e) {
        $body.toggleClass('mobile-nav-active'); 
        $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars'); 
        $('#mobile-body-overly').toggle(); 
      });

      // Fecha o menu mobile se clicar fora dele ou em um link do menu
      $document.on('click', '#mobile-nav a, #mobile-body-overly', function(e) { // Adicionado #mobile-nav a
        if ($body.hasClass('mobile-nav-active')) {
            // Verifica se o clique foi em um link que não tem submenu ou no overlay
            if ($(this).is('#mobile-body-overly') || !$(this).parent().hasClass('menu-has-children')) {
                $body.removeClass('mobile-nav-active');
                $('#mobile-nav-toggle i').removeClass('fa-times').addClass('fa-bars');
                $('#mobile-body-overly').fadeOut();
            }
        }
      });
      // Previne que o clique no toggle feche o menu imediatamente se o evento propagar
      $document.on('click', '#mobile-nav-toggle', function(e){
          e.stopPropagation(); 
      });


    } else if ($("#mobile-nav, #mobile-nav-toggle").length) {
      $("#mobile-nav, #mobile-nav-toggle").hide();
    }
  }

  function initSmoothScroll() {
    $('.nav-menu a, #mobile-nav a, .scrollto').on('click', function(e) {
      if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
        const target = $(this.hash); 
        if (target.length) {
          e.preventDefault(); 
          let top_space = 0;
          if ($header.length && $header.css('position') === 'fixed') { 
            top_space = $header.outerHeight();
            if (!$header.hasClass('scroll-header')) { // Se o header ainda não apareceu, considera sua altura mesmo assim
                // Isso pode precisar de ajuste se a altura do header mudar quando 'scroll-header' é adicionado
            }
          }
          $('html, body').animate({
            scrollTop: target.offset().top - top_space
          }, 800, 'easeInOutExpo');

          if ($(this).parents('.nav-menu').length) {
            $('.nav-menu .menu-active').removeClass('menu-active');
            $(this).closest('li').addClass('menu-active');
          }
          // A lógica de fechar o menu mobile ao clicar em um link já foi integrada em initMobileNav
        }
      }
    });
  }

  // --- Execução e Event Listeners ---
  $window.on('load', function() {
    calculateSectionOffsets();
    handleScrollEffects(); // Chamada inicial para o caso da página carregar já rolada e para o overlay
    updateNavActiveState();
    // (Chamada para animateIntroElements FOI REMOVIDA)
  });

  const debouncedScrollHandler = debounce(function() {
    handleScrollEffects();
    updateNavActiveState();
  }, 15);
  $window.on('scroll', debouncedScrollHandler);

  const debouncedResizeHandler = debounce(function() {
    calculateSectionOffsets();
    updateNavActiveState(); 
  }, 200);
  $window.on('resize', debouncedResizeHandler);

  initBackToTop();
  initMobileNav();
  initSmoothScroll();

})(jQuery);