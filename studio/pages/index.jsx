import { Grid, MantineProvider } from "@mantine/core";
import styled from "@emotion/styled";

import Logo from "../components/Logo";
import Card from "../components/Card";
import PageSlogan from "../components/PageSlogan";
import ImageContainer from "../components/ImageContainer";
import InfoCard from "../components/InfoCard";

const Header = styled.div`
  display: flex;
  align-items: left;
  justify-content: space-between;
  margin: 64px 48px;
  max-width: 1200px;
  flex-direction: column;
  gap: 32px;

  @media screen and (min-width: 960px) {
    flex-direction: row;
    gap: 0;
  }

  @media screen and (max-width: 767px) {
    svg {
      width: 100%;
    }
  }
`;

export default function Page() {
  return (
    <MantineProvider withNormalizeCSS>
      <div>
        <Header>
          <Logo />
          <PageSlogan />
        </Header>
        <Grid m={{ base: "12px", sm: "64px" }} gutter="80px">
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>ANY LEVEL OF COMPLEXITY</h3>
              <p>
                With Stages Studio you can build forms of any complexity. From
                the simplest non-structured forms to highly complex, dynamic
                wizards.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>DATA STORAGE OR WEBHOOKS</h3>
              <p>
                Store data on our servers and/or use webhooks to store data in
                your own content management system.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>PUBLISHING WORK-FLOW</h3>
              <p>
                Set up editing and approval workflows for your company/client
                team or leave it simple and publish yourself.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>FORM SPANNING RELATIONSHIPS</h3>
              <p>
                Connect multiple forms by defining relationships between them
                and create a whole application of connected forms.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>LIBRARY OF PRE-MADE VALIDATIONS</h3>
              <p>
                Getting validation right can be tricky. Stages Studio has a big
                library of pre-made validation rules you can combine in your
                forms.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>EXPORT FORMS TO REACT</h3>
              <p>
                If you need more control over styles, validations and storage
                logic, you can export any form to React and use it in your own
                project.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>MODULAR BY DESIGN</h3>
              <p>
                You can reuse a fields config or a whole fieldset wherever you
                want, by simply referencing it by its path.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>DYNAMIC TEMPLATE LITERALS</h3>
              <p>
                Any type of text, like labels and placeholders or step
                summaries, can reference any form data and aggregations of it.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>VISUAL EDITING</h3>
              <p>
                Inspired by Figma, Stages Studio has a visual editor where you
                can directly click on a field to edit it, or drag and drop a
                field to a new location.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>PROFESSIONAL FEATURES</h3>
              <p>
                Professional features like Undo/Redo, Interface State,
                Internationalisation, Autosaving etc. can be activated on any
                form.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>ACCESSIBILITY</h3>
              <p>
                Stages Studio is built with accessibility in mind. It is
                designed to be as accessible as possible without compromising on
                features.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>THEMING</h3>
              <p>
                Every part of a Form can be themed. You can choose from a wide
                range of themes or create your own. And when exported to React,
                no limits are placed on what you can do.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>VERSION CONTROL</h3>
              <p>
                Everything you create in Stages Studio is version controlled to
                guarantee non of your references go missing, and you can fork
                non-private forms.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>PATHS TO EVERYTHING</h3>
              <p>
                Everything in Stages Studio has a path. You can reference
                anything by its path anywhere you want, as long as you have
                permission to do that.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>FIELD TYPES</h3>
              <p>
                A large collection of freely themeable and accessible field
                types is available for each possible data type, for endless
                creations.
              </p>
            </Card>
          </Grid.Col>
          <Grid.Col xs={12} sm={6} lg={4} xl={3}>
            <Card>
              <h3>BOT SPAM PREVENTION</h3>
              <p>
                Last thing you want is bots spamming your forms. Stages Studio
                has powerfull anti-bot spam built in to prevent this.
              </p>
            </Card>
          </Grid.Col>
        </Grid>
        <ImageContainer>
          <div>
            <img
              src="/stages-studio-editor-preview.png"
              alt="Stages Studio editor preview"
            />
          </div>
        </ImageContainer>
        <InfoCard>
          <div>
            <h2>Any level of complexity</h2>
            <img
              src="/infocard-simple-complex.svg"
              alt="infocard simple complex"
            />
            <p>
              With Stages Studio, you have the power to construct forms of
              unparalleled complexity. From the most basic, unstructured forms
              that follow a linear progression from top to bottom, to intricate
              and dynamic wizards featuring nested fields and modular fieldsets.
              You can effortlessly create array-like structures with collections
              of fields, and exercise complete control over the visibility of
              individual fields and even entire wizard steps, all based on
              previously entered data.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Storage options</h2>
            <img
              src="/infocard-storage-options.svg"
              alt="infocard storage options"
            />
            <p>
              Store data on our servers where you can choose any region which
              suites you, for example if you need to follow EU law. You can also
              choose to store data on your own server by creating a webhook
              which handles all the data we send to it. Or you go fully custom
              and export the form to React and use it in your own project with
              your own data storage. Fully up to you. By using your own storage
              option you loose some features, but you gain full control over
              your data.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Publishing workflow</h2>
            <img
              src="/infocard-publishing-workflow.svg"
              alt="infocard publishing workflow"
            />
            <p>
              You can setup permissions and a publishing workflow for any of
              your forms. Per default, all your forms will initially be set
              private. You can than choose to invite specific people, one or
              multiple companies or the whole world to fill out your form. In a
              professional context, you first start by defining a publishing
              workflow for your company. This makes sure no form gets published
              to your clients before it's quality is being checked by the right
              people. For this, you can either use one of hour permission
              templates or create your own set of detailed permissions.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Form spanning relationships</h2>
            <img
              src="/infocard-form-spanning-relationships.svg"
              alt="infocard form spanning relationships"
            />
            <p>
              Relationships between forms can be very useful for creating a
              whole application of connected forms. This lifts up a simple form
              creation tool into almost a fully fledged content managment
              system. And if you use this feature with well defined permissions,
              you could even create an app for your visitors. Usually you use
              this feature with select fields, where a certain field of another
              form becomes the values of a select.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Pre-made validations</h2>
            <img
              src="/infocard-pre-made-validations.svg"
              alt="infocard pre-made validations"
            />
            <p>
              Validations can be very complex. Ever seen the full email
              validation regex? Or what if you not only want to check an email
              for it's format, but also check if the domain in it actually
              exists? This is where we come in. We've prepared and are
              constantly updating various validations for different usecases.
              This makes sure no form gets published without correct data and
              without you having to reaseach and create all those complex
              validation rules and API calls.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Export to React</h2>
            <img
              src="/infocard-export-to-react.svg"
              alt="infocard export to react"
            />
            <p>
              Stages Studio has started as a simple form creation tool for us to
              make creating forms in our client projects easier. This is why we
              have an export to React feature. Export to React gives you all you
              need to integrate a form you've created in Stages Studio. This
              includes all the configs, all the necessary components, all the
              validations and a JSON schema in case you want to implement your
              own backend API.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Modular by design</h2>
            <img
              src="/infocard-modular-by-design.svg"
              alt="infocard modular by design"
            />
            <p>
              Stages was designed from the ground up to be as modular and
              expandable as possible. This doesn't stop at it's code, but is
              also reflected in how you create your forms. For example it makes
              little sense to create address fields again and again in all your
              client forms. With Stages Studio you can create them once and than
              link them from inside all your forms. On top of that, we and the
              community creates reusable form parts which you can use, so you
              don't have to reinvent the wheel.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Dynamic template literals</h2>
            <img
              src="/infocard-dynamic-template-literals.svg"
              alt="infocard dynamic template literals"
            />
            <p>
              Static texts are great, but dynamic texts are definitely better.
              With Stages Studio you can use template literals to access the
              data already entered in your form or wizard. This way all your
              texts can be dynamic, no matter where that text occurs, as labels,
              placeholders, error texts or wizard summaries, just to name a few
              examples. Additionally, you can perform different aggregations on
              the data, for even more power. And of course you don't have to
              learn any cryptic syntax for that, it's the same as in JavaScript,
              and Studio helps you with autocompletion.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Visual editing</h2>
            <img
              src="/infocard-visual-editing.svg"
              alt="infocard visual editing"
            />
            <p>
              Stages Studio lets you edit your forms visually, you always get
              what you see. With a similar interface as Figma, but optimized for
              creating forms, you can create forms of any complexity with ease.
              And the form your editing is always functional, so you can
              experience it while you create it. Even better, as in Figma,
              multiple team members can work on the same form, and they can
              share mock data to test various cases. You can drag and drop
              fields around, insert fieldsets from other forms and so on. It's
              intuitive and powerfull.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Professional features</h2>
            <img
              src="/infocard-professional-features.svg"
              alt="infocard professional features"
            />
            <p>
              We use Stages forms in Stages Studio and in client projects. All
              the professional features we've developed for those projects, are
              available in the editor, as well. You can enable Undo/Redo,
              Interface State, Internationalisation, Autosaving etc. in any
              form. In principle, you can create full applications with these
              features, or you can ignore them and use Stages Studio to create
              your basic simple forms, completely up to you.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Accessibility</h2>
            <img
              src="/infocard-accessibility.svg"
              alt="infocard accessibility"
            />
            <p>
              Most of our clients demand that their forms to be accessible. With
              Stages Studio, you get that for free. We only use components which
              have a strong focus on accessibility because we think that's the
              right thing to do, even if a client would not demand it. You don't
              have to do anything to enable it, we have smart defaults which add
              the correct tags and content where needed. You can than override
              them if you want to further improve on those defaults.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Theming</h2>
            <img src="/infocard-theming.svg" alt="infocard theming" />
            <p>
              In Stages Studio you have three options to theme your form. First
              is to choose a pre-made theme from our own designers. Second is to
              use create your own theme by writing your own CSS which targets
              the classes we put on each element. And the third and most
              flexible option is to export your form to React, and create your
              own field components and render functions. All our own themes have
              a light and a dark mode, which helps accessibility. The exported
              forms come ready made with our field components, so you don't have
              to start from scratch and you already get a good base for
              accessibility.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Version control</h2>
            <img src="/infocard-versioning.svg" alt="infocard versioning" />
            <p>
              All your changes to a form are constantly version controlled. This
              has many advantages. For example you can always roll back changes.
              You can always fork specific versions of your forms to create a
              new one. You can create new major versions which have breaking
              changes, and if referenced from other forms, those forms will not
              brake because of it. Version control in Stages Studio is
              completely seamless, definitely no need to learn any git commands!
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Paths to everything</h2>
            <img src="/infocard-path.svg" alt="infocard path" />
            <p>
              Behind the scenes, you can think of everything in Stages as a big
              JSON object. Every configuration and all data entered, has its
              place in that big JSON object and can be accessed by it's path (if
              you have the necessary permissions to that specific place in the
              data). This makes it possible to for example reuse fieldsets in
              other forms, or use data entered in one form as options in
              another.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Field Types</h2>
            <img src="/infocard-field-types.svg" alt="infocard field types" />
            <p>
              Stages Studio comes with anything from the simplest text input
              fields, to complex date range choosers. For each data type,
              multiple field types are available to enter them. Complex types
              exists, as well, to enter complex data structures. And by freely
              combining them, you can craete the most complex data structures in
              your forms.
            </p>
          </div>
        </InfoCard>
        <InfoCard>
          <div>
            <h2>Bot Spam Prevention</h2>
            <img src="/infocard-bot-spam.svg" alt="infocard bot spam" />
            <p>
              Stages Studio comes with a powerful anti-bot spam system built in,
              which prevents bots from spamming your forms. And it does that
              without users having to enter a cryptic captchas. Additionally you
              can have invitation only forms or forms where only registered
              users can enter data, to be even more restrictive.
            </p>
          </div>
        </InfoCard>
      </div>
    </MantineProvider>
  );
}
