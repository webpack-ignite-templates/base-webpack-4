import '../../assets/scss/foundation/foundation_base.scss';
import '../../assets/scss/layout.scss';
import '../../assets/scss/index.scss';


if (module.hot) {
  require(`../../page2.ejs`);

  module.hot.accept(`../../page2.ejs`, ()=>{
      window.console.info("HTML has been updated, reloading!")
      window.location.reload();
  });

  module.hot.accept();
}