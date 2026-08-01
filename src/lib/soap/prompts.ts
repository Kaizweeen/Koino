import type { ThemeSlug } from "@/lib/themes";

export interface SoapPrompts {
  observation: string;
  application: string;
  prayer: string;
}

export const SOAP_PROMPTS: Record<ThemeSlug, SoapPrompts> = {
  peace:      { observation: "What does this verse show you about where true rest is found?", application: "Where do you most need to stop striving and trust today?", prayer: "Ask God to quiet one thing you are carrying." },
  gratitude:  { observation: "What good gift from God does this passage bring into view?", application: "What is one specific thing you can thank God for right now?", prayer: "Name that gift back to God with thanks." },
  hope:       { observation: "What promise or future does this verse point you toward?", application: "Where do you need hope to steady you today?", prayer: "Ask God to anchor you in what he has promised." },
  lament:     { observation: "What honest thing does this passage give you permission to bring to God?", application: "What grief or weight do you need to carry to God today, rather than hold alone?", prayer: "Tell God plainly what hurts, and ask him to sit with you in it." },
  surrender:  { observation: "What is this verse inviting you to release into God's hands?", application: "What are you gripping tightly that you could loosen your hold on today?", prayer: "Hand that thing to God, and ask for the trust to leave it there." },
  awe:        { observation: "What does this passage reveal about how great God is?", application: "How could seeing God as this big change the way you meet today?", prayer: "Worship God for something about him that is far bigger than you." },
  joy:        { observation: "What goodness of God does this verse point you toward?", application: "What is one gift today that you could stop and actually celebrate?", prayer: "Thank God for something specific, out loud in your prayer." },
  repentance: { observation: "What does this verse show you honestly about your own heart?", application: "Is there one thing you sense God gently asking you to turn from?", prayer: "Tell God what you want to turn back to him, and receive his mercy." },
  strength:   { observation: "Where does this passage say your strength actually comes from?", application: "What are you facing today that you need God's steadiness for?", prayer: "Ask God for the courage and strength you don't have on your own." },
  comfort:    { observation: "How does this verse show God drawing near to those who hurt?", application: "Where do you need to let God comfort you today, instead of coping alone?", prayer: "Let God near the tender place, and ask him to hold you there." },
  love:       { observation: "What does this passage show you about how God loves you?", application: "How could resting in that love change how you treat someone today?", prayer: "Receive God's love, and ask to carry it to someone else." },
  longing:    { observation: "What is this verse teaching you about seeking and waiting on God?", application: "What are you waiting for, and how can you keep seeking God in it?", prayer: "Tell God what you long for, and ask him to meet you as you wait." },
};

export function getSoapPrompts(theme: ThemeSlug): SoapPrompts {
  return SOAP_PROMPTS[theme];
}
