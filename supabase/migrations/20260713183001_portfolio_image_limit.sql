-- Preserva o limite de ~2MB por imagem de portfólio que antes era validado
-- no Express (isValidBody / MAX_IMAGE_LENGTH), agora como defesa em profundidade
-- direto no banco (a validação principal continua no cliente).
alter table portfolio_projects
  add constraint portfolio_projects_image_length check (char_length(image) <= 3000000);
